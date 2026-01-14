const crypto = require('crypto');
const axios = require('axios');

const normalizeMoMoAmount = (amount) => {
  // MoMo amounts are in VND and must be an integer.
  // Normalizing prevents signature mismatches caused by float serialization.
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n));
};

/**
 * Generate unique request ID for MoMo transaction
 * @returns {string} Request ID in format MOMO_timestamp
 */
const generateRequestId = () => {
  return `MOMO_${Date.now()}`;
};

/**
 * Generate unique order ID for MoMo transaction
 * @returns {string} Order ID in format ORDER_timestamp
 */
const generateOrderId = () => {
  return `ORDER_${Date.now()}`;
};

/**
 * Generate HMAC-SHA256 signature for MoMo request
 * @param {Object} data - Request data containing payment parameters
 * @returns {string} HMAC-SHA256 signature
 */
const generateSignature = (data) => {
  const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;
  
  return crypto
    .createHmac('sha256', process.env.MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');
};

/**
 * Verify signature from MoMo callback
 * @param {Object} data - Callback data from MoMo
 * @param {string} signature - Signature to verify
 * @returns {boolean} True if signature is valid
 */
const verifySignature = (data, signature) => {
  // MoMo sends extraData already Base64-encoded; use as-is
  const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType || 'momo_wallet'}&partnerCode=${data.partnerCode}&payType=${data.payType || 'qr'}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');
  
  return signature === expectedSignature;
};

/**
 * Create payment request with MoMo
 * @param {string} orderInfo - Order description
 * @param {number} amount - Payment amount
 * @param {string} extraData - Additional data (JSON string)
 * @returns {Promise<Object>} MoMo payment response with payUrl
 */
const createPayment = async (orderInfo, amount, extraData = '') => {
  const requestId = generateRequestId();
  const orderId = generateOrderId();
  // MoMo expects extraData to be Base64-encoded; keep empty string if none
  const encodedExtraData = extraData ? Buffer.from(extraData).toString('base64') : '';
  const normalizedAmount = normalizeMoMoAmount(amount);
  
  const requestData = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    requestId: requestId,
    amount: normalizedAmount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    ipnUrl: process.env.MOMO_IPN_URL,
    extraData: encodedExtraData,
    requestType: 'captureWallet',
    lang: 'en'
  };

  // Generate signature (must use encodedExtraData)
  requestData.signature = generateSignature(requestData);

  try {
    const response = await axios.post(
      `${process.env.MOMO_ENDPOINT}/v2/gateway/api/create`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.resultCode !== 0) {
      throw new Error(getErrorMessage(response.data.resultCode));
    }

    return {
      payUrl: response.data.payUrl,
      requestId: requestId,
      orderId: orderId,
      resultCode: response.data.resultCode,
      message: response.data.message
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`MoMo API Error: ${error.response.data.message || error.message}`);
    }
    throw new Error(`MoMo Request Failed: ${error.message}`);
  }
};

/**
 * Query payment status from MoMo
 * @param {string} requestId - Original request ID
 * @returns {Promise<Object>} Payment status response
 */
const queryPaymentStatus = async (requestId) => {
  const queryData = {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    requestId: requestId,
    orderId: requestId.replace('MOMO_', 'ORDER_'),
    lang: 'en'
  };

  // Generate signature for query
  const rawSignature = `accessKey=${queryData.accessKey}&orderId=${queryData.orderId}&partnerCode=${queryData.partnerCode}&requestId=${queryData.requestId}`;
  queryData.signature = crypto
    .createHmac('sha256', process.env.MOMO_SECRET_KEY)
    .update(rawSignature)
    .digest('hex');

  try {
    const response = await axios.post(
      `${process.env.MOMO_ENDPOINT}/v2/gateway/api/query`,
      queryData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`MoMo API Error: ${error.response.data.message || error.message}`);
    }
    throw new Error(`MoMo Query Failed: ${error.message}`);
  }
};

/**
 * Get human-readable error message from MoMo result code
 * @param {number} resultCode - MoMo result code
 * @returns {string} Error message
 */
const getErrorMessage = (resultCode) => {
  const errorMessages = {
    0: 'Success',
    9000: 'Transaction confirmed',
    1000: 'Transaction initiated',
    1001: 'Transaction rejected by issuer',
    1002: 'Transaction declined',
    1003: 'Transaction cancelled',
    1004: 'Transaction failed due to timeout',
    1005: 'Transaction failed',
    1006: 'User rejected transaction',
    1007: 'Transaction is pending',
    2001: 'Invalid parameters',
    2007: 'Invalid signature',
    3001: 'Transaction not found',
    3002: 'Invalid amount',
    3003: 'Payment exceeds limit',
    4001: 'Invalid access key',
    4010: 'Duplicate request ID',
    4011: 'Duplicate order ID',
    4100: 'Merchant account not found',
    7000: 'System error',
    7002: 'Payment gateway error'
  };

  return errorMessages[resultCode] || `Unknown error (code: ${resultCode})`;
};

module.exports = {
  generateRequestId,
  generateOrderId,
  generateSignature,
  verifySignature,
  createPayment,
  queryPaymentStatus,
  getErrorMessage
};
