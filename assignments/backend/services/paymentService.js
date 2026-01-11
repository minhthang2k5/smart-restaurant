const { TableSession, Order, MenuItem, PaymentTransaction } = require('../models/associations');
const momoService = require('./momoService');
const sequelize = require('../config/database');

  /**
   * Initiate payment for a table session
   * @param {string} sessionId - Table session ID
   * @param {string} userId - User ID making the payment
   * @returns {Promise<Object>} Payment initiation result with payUrl
   */
  const initiatePayment = async (sessionId, userId) => {
    const transaction = await sequelize.transaction();

    try {
      // Load session with orders
      const session = await TableSession.findByPk(sessionId, {
        include: [{
          model: Order,
          as: 'orders'
        }],
        transaction
      });

      // Validate session exists
      if (!session) {
        throw new Error('Session not found');
      }

      // Validate session belongs to user
      if (session.customer_id !== userId) {
        throw new Error('Unauthorized: This session does not belong to you');
      }

      // Validate session status
      if (session.status === 'completed' || session.status === 'cancelled') {
        throw new Error('Cannot initiate payment for a completed or cancelled session');
      }

      // Validate session is not already paid
      if (session.payment_status === 'paid') {
        throw new Error('This session has already been paid');
      }

      // Validate session has orders
      if (!session.orders || session.orders.length === 0) {
        throw new Error('Cannot initiate payment: Session has no orders');
      }

      // Calculate total amount from orders (same logic as sessionService.completeSession)
      let totalSubtotal = 0;
      
      for (const order of session.orders) {
        // Only include accepted/completed orders (not rejected)
        if (order.status !== 'rejected') {
          totalSubtotal += parseFloat(order.subtotal || 0);
        }
      }
      
      const taxAmount = totalSubtotal * 0.1; // 10% tax
      const totalAmount = totalSubtotal + taxAmount;

      if (totalAmount <= 0) {
        throw new Error('Cannot initiate payment: Total amount must be greater than zero');
      }

      // MoMo requires minimum 1,000 VND and maximum 50,000,000 VND
      if (totalAmount < 1000) {
        throw new Error(`Cannot initiate payment: Total amount (${totalAmount} VND) is below MoMo minimum of 1,000 VND. Please add more items or check order pricing.`);
      }

      if (totalAmount > 50000000) {
        throw new Error(`Cannot initiate payment: Total amount (${totalAmount} VND) exceeds MoMo maximum of 50,000,000 VND.`);
      }

      // Update session status to pending payment
      session.status = 'pending_payment';
      session.payment_status = 'pending';
      session.payment_method = 'momo';
      await session.save({ transaction });

      // Create payment with MoMo
      const orderInfo = `Payment for session ${sessionId}`;
      const extraData = JSON.stringify({ sessionId, userId });
      
      const momoResponse = await momoService.createPayment(orderInfo, totalAmount, extraData);

      // Update session with MoMo tracking fields
      session.momo_request_id = momoResponse.requestId;
      session.momo_order_id = momoResponse.orderId;
      session.momo_payment_amount = totalAmount;
      session.momo_raw_response = momoResponse;
      await session.save({ transaction });

      // Create PaymentTransaction audit record
      await PaymentTransaction.create({
        table_session_id: sessionId,
        payment_method: 'momo',
        request_id: momoResponse.requestId,
        amount: totalAmount,
        status: 'pending',
        raw_response: momoResponse
      }, { transaction });

      await transaction.commit();

      return {
        payUrl: momoResponse.payUrl,
        requestId: momoResponse.requestId,
        orderId: momoResponse.orderId,
        amount: totalAmount
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

/**
 * Process MoMo payment callback
 * @param {Object} callbackData - Callback data from MoMo
 * @returns {Promise<Object>} Processing result
 */
const processCallback = async (callbackData) => {
  const transaction = await sequelize.transaction();

  try {
    // Verify signature
    const isValidSignature = momoService.verifySignature(callbackData, callbackData.signature);
    if (!isValidSignature) {
      throw new Error('Invalid signature');
    }

    // Extract session ID from extraData (MoMo sends Base64)
    let sessionId;
    try {
      const decoded = callbackData.extraData
        ? Buffer.from(callbackData.extraData, 'base64').toString('utf8')
        : '{}';
      const extraData = JSON.parse(decoded || '{}');
      sessionId = extraData.sessionId;
    } catch (e) {
      throw new Error('Invalid extraData format');
    }

    if (!sessionId) {
      throw new Error('Session ID not found in callback data');
    }

    // Load session
    const session = await TableSession.findByPk(sessionId, { transaction });
    if (!session) {
      throw new Error('Session not found');
    }

    // Validate amount matches
    const expectedAmount = parseFloat(session.momo_payment_amount);
    const receivedAmount = parseFloat(callbackData.amount);
    if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
      throw new Error(`Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`);
    }

    // Check for duplicate transaction (idempotency)
    if (session.momo_transaction_id === callbackData.transId) {
      // Already processed, return success
      return {
        success: true,
        message: 'Transaction already processed',
        duplicate: true
      };
    }

    // Update session based on payment result
    const isSuccess = callbackData.resultCode === 0;
    
    session.momo_transaction_id = callbackData.transId;
    session.momo_payment_status = callbackData.message;
    session.momo_response_code = String(callbackData.resultCode);
    session.momo_signature = callbackData.signature;
    session.momo_raw_response = callbackData;
    
    if (isSuccess) {
      session.payment_status = 'paid';
      session.status = 'completed';
      session.momo_payment_time = new Date();
    } else {
      session.payment_status = 'failed';
      session.momo_error_message = callbackData.message;
    }

    await session.save({ transaction });

    // Update PaymentTransaction record
    await PaymentTransaction.create({
      table_session_id: sessionId,
      payment_method: 'momo',
      transaction_id: callbackData.transId,
      request_id: callbackData.requestId,
      amount: callbackData.amount,
      status: isSuccess ? 'completed' : 'failed',
      response_code: String(callbackData.resultCode),
      message: callbackData.message,
      raw_response: callbackData
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      message: isSuccess ? 'Payment processed successfully' : 'Payment failed',
      paymentStatus: session.payment_status
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get payment status for a session
 * @param {string} sessionId - Table session ID
 * @param {string} userId - User ID requesting status
 * @returns {Promise<Object>} Payment status details
 */
const getPaymentStatus = async (sessionId, userId) => {
  const session = await TableSession.findByPk(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  // Validate session belongs to user
  if (session.customer_id !== userId) {
    throw new Error('Unauthorized: This session does not belong to you');
  }

  return {
    payment_status: session.payment_status,
    payment_method: session.payment_method,
    momo_payment_amount: session.momo_payment_amount,
    momo_payment_time: session.momo_payment_time,
    momo_transaction_id: session.momo_transaction_id,
    momo_payment_status: session.momo_payment_status,
    momo_response_code: session.momo_response_code,
    momo_error_message: session.momo_error_message
  };
};

/**
 * Cancel payment for a session
 * @param {string} sessionId - Table session ID
 * @param {string} userId - User ID cancelling payment
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancellation result
 */
const cancelPayment = async (sessionId, userId, reason) => {
  const transaction = await sequelize.transaction();

  try {
    const session = await TableSession.findByPk(sessionId, { transaction });

    if (!session) {
      throw new Error('Session not found');
    }

    // Validate session belongs to user (TableSession uses customer_id)
    if (session.customer_id !== userId) {
      throw new Error('Unauthorized: This session does not belong to you');
    }

    // Validate can be cancelled
    if (session.payment_status === 'paid') {
      throw new Error('Cannot cancel: Payment has already been completed');
    }

    // Update session status
    session.payment_status = 'failed';
    session.status = 'cancelled';
    session.momo_error_message = `Cancelled by user: ${reason}`;
    await session.save({ transaction });

    // Create PaymentTransaction cancellation record
    await PaymentTransaction.create({
      table_session_id: sessionId,
      payment_method: 'momo',
      request_id: session.momo_request_id,
      amount: session.momo_payment_amount,
      status: 'cancelled',
      message: `Cancelled by user: ${reason}`,
      raw_response: { reason, cancelledAt: new Date() }
    }, { transaction });

    await transaction.commit();

    return {
      success: true,
      message: 'Payment cancelled successfully'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  initiatePayment,
  processCallback,
  getPaymentStatus,
  cancelPayment
};
