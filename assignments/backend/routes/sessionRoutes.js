const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

// Note: For development/testing, authentication might be optional
// In production, uncomment authenticate middleware

/**
 * @route   POST /api/sessions
 * @desc    Create new table session
 * @access  Public (Customer can start session)
 */
router.post("/", optionalAuthenticate, sessionController.createSession);

/**
 * @route   GET /api/sessions/table/:tableId
 * @desc    Get active session for a table
 * @access  Public
 */
router.get("/table/:tableId", sessionController.getSessionByTableId);

/**
 * @route   GET /api/sessions/table/:tableId/check
 * @desc    Smart session status check (active + recent completed)
 * @access  Public
 */
router.get("/table/:tableId/check", sessionController.checkTableSessionStatus);

/**
 * @route   GET /api/sessions/my-sessions
 * @desc    Get customer's order history
 * @access  Authenticated customers only
 * @note    MUST be before /:id route to avoid UUID parsing conflict
 */
router.get("/my-sessions", authenticate, sessionController.getMySessionHistory);

/**
 * @route   GET /api/sessions/waiter/bill-requests
 * @desc    Get all pending bill requests
 * @access  Staff (waiter) - authentication can be added
 * @note    MUST be before /:id route to avoid UUID parsing conflict
 */
router.get("/waiter/bill-requests", sessionController.getPendingBillRequests);

/**
 * @route   GET /api/sessions/:id
 * @desc    Get session details by ID
 * @access  Public
 */
router.get("/:id", sessionController.getSessionById);

/**
 * @route   POST /api/sessions/:id/claim
 * @desc    Claim/link session to customer (after login)
 * @access  Authenticated customer (optionalAuthenticate to get user from token)
 */
router.post("/:id/claim", optionalAuthenticate, sessionController.claimSession);

/**
 * @route   POST /api/sessions/:id/orders
 * @desc    Create new order in session
 * @access  Public (Customer can order)
 */
router.post("/:id/orders", optionalAuthenticate, sessionController.createOrderInSession);

/**
 * @route   POST /api/sessions/:id/complete
 * @desc    Complete session with payment
 * @access  Public (Customer pays) or Staff
 */
router.post("/:id/complete", optionalAuthenticate, sessionController.completeSession);

/**
 * @route   POST /api/sessions/:id/cancel
 * @desc    Cancel session
 * @access  Staff only (add authenticate + authorize if needed)
 */
router.post("/:id/cancel", sessionController.cancelSession);

/**
 * @route   POST /api/sessions/:id/request-bill
 * @desc    Request bill for session (mock feature - does not trigger payment)
 * @access  Public (Customer can request)
 */
router.post("/:id/request-bill", sessionController.requestBill);

/**
 * @route   GET /api/sessions/:id/bill-preview
 * @desc    Get bill preview for a session
 * @access  Public (Customer or waiter can view)
 */
router.get("/:id/bill-preview", sessionController.getBillPreview);

/**
 * @route   PATCH /api/sessions/:id/clear-bill-request
 * @desc    Clear bill request (waiter acknowledges)
 * @access  Staff (waiter) - authentication can be added
 */
router.patch("/:id/clear-bill-request", sessionController.clearBillRequest);

module.exports = router;
