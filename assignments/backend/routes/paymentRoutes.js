const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { optionalAuthenticate } = require('../middleware/auth');


// Initiate MoMo payment for a session (customer login optional)
router.post('/sessions/:id/payment/momo/initiate', optionalAuthenticate, paymentController.initiateMoMoPayment);

// MoMo callback endpoint (no authentication - MoMo server calls this)
router.post('/payment/momo/callback', paymentController.handleMoMoCallback);

// Get payment status for a session (customer login optional)
router.get('/sessions/:id/payment/status', optionalAuthenticate, paymentController.getPaymentStatus);

// Cancel MoMo payment for a session (customer login optional)
router.post('/sessions/:id/payment/momo/cancel', optionalAuthenticate, paymentController.cancelMoMoPayment);

module.exports = router;
