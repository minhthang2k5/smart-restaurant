const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
// COMMENTED FOR TESTING - REMEMBER TO UNCOMMENT IN PRODUCTION!
// const { authenticate, authorize } = require("../middleware/auth");

/**
 * Customer routes (require authentication)
 */

/**
 * @route   GET /api/orders/table/:tableId
 * @desc    Get active order for a table
 * @access  Public (Customer can view their order)
 */
router.get("/table/:tableId", orderController.getOrderByTableId);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID with full details
 * @access  Public (Customer can view their order)
 */
router.get("/:id", orderController.getOrderById);

/**
 * Waiter/Admin routes
 */

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters
 * @access  Private (Admin/Waiter only)
 * @query   status, tableId, date, limit
 */
// TESTING: Auth disabled
router.get("/", /* authenticate, authorize(["admin", "waiter"]), */ orderController.getAllOrders);

/**
 * @route   POST /api/orders/:id/accept
 * @desc    Accept order (Waiter)
 * @access  Private (Waiter/Admin only)
 */
// TESTING: Auth disabled
router.post("/:id/accept", /* authenticate, authorize(["admin", "waiter"]), */ orderController.acceptOrder);

/**
 * @route   POST /api/orders/:id/reject
 * @desc    Reject order (Waiter)
 * @access  Private (Waiter/Admin only)
 * @body    reason (required)
 */
// TESTING: Auth disabled
router.post("/:id/reject", /* authenticate, authorize(["admin", "waiter"]), */ orderController.rejectOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Waiter/Admin only)
 * @body    status (required)
 */
// TESTING: Auth disabled
router.patch("/:id/status", /* authenticate, authorize(["admin", "waiter"]), */ orderController.updateOrderStatus);

/**
 * @route   PATCH /api/orders/items/:itemId/status
 * @desc    Update individual order item status (for kitchen)
 * @access  Private (Waiter/Admin only)
 * @body    status (required)
 */
// TESTING: Auth disabled
router.patch("/items/:itemId/status", /* authenticate, authorize(["admin", "waiter"]), */ orderController.updateOrderItemStatus);

/**
 * @route   POST /api/orders/:id/complete
 * @desc    Complete order (mark as completed)
 * @access  Private (Waiter/Admin only)
 * @note    Payment is handled at Session level
 */
// TESTING: Auth disabled
router.post("/:id/complete", /* authenticate, authorize(["admin", "waiter"]), */ orderController.completeOrder);

module.exports = router;