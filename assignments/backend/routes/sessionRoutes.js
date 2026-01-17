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

module.exports = router;
