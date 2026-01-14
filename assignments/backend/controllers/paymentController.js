const paymentService = require('../services/paymentService');

/**
 * Initiate MoMo payment for a table session
 * POST /api/sessions/:id/payment/momo/initiate
 */
const initiateMoMoPayment = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id ?? null;

    const result = await paymentService.initiatePayment(sessionId, userId);

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error initiating MoMo payment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Handle MoMo payment callback (IPN)
 * POST /api/payment/momo/callback
 */
const handleMoMoCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    const result = await paymentService.processCallback(callbackData);

    // MoMo expects 204 No Content for successful processing
    res.status(204).send();
  } catch (error) {
    console.error('Error processing MoMo callback:', error);
    // Still return 204 to prevent MoMo from retrying
    res.status(204).send();
  }
};

/**
 * Get payment status for a session
 * GET /api/sessions/:id/payment/status
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id ?? null;

    const status = await paymentService.getPaymentStatus(sessionId, userId);

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cancel MoMo payment for a session
 * POST /api/sessions/:id/payment/momo/cancel
 */
const cancelMoMoPayment = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user?.id ?? null;
    const { reason } = req.body;

    const result = await paymentService.cancelPayment(sessionId, userId, reason || 'User cancelled');

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error cancelling MoMo payment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  initiateMoMoPayment,
  handleMoMoCallback,
  getPaymentStatus,
  cancelMoMoPayment
};
