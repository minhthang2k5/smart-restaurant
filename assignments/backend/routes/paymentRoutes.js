const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Initiate MoMo payment for a session (requires authentication)
router.post('/sessions/:id/payment/momo/initiate', authenticate, paymentController.initiateMoMoPayment);

// MoMo callback endpoint (no authentication - MoMo server calls this)
router.post('/payment/momo/callback', paymentController.handleMoMoCallback);

// Get payment status for a session (requires authentication)
router.get('/sessions/:id/payment/status', authenticate, paymentController.getPaymentStatus);

// Cancel MoMo payment for a session (requires authentication)
router.post('/sessions/:id/payment/momo/cancel', authenticate, paymentController.cancelMoMoPayment);

module.exports = router;
