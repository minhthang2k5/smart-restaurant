/**
 * Cart Routes
 * API endpoints for cart validation and summary
 * Note: Cart is client-side, these endpoints are for validation before order placement
 */

const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

/**
 * @route   POST /api/cart/validate
 * @desc    Validate cart items before placing order
 * @access  Public
 * @body    { items: Array }
 */
router.post("/validate", cartController.validateCart);

/**
 * @route   POST /api/cart/summary
 * @desc    Get cart summary with pricing and validation
 * @access  Public
 * @body    { items: Array }
 */
router.post("/summary", cartController.getCartSummary);

/**
 * @route   POST /api/cart/can-order
 * @desc    Check if cart can be converted to order
 * @access  Public
 * @body    { items: Array }
 */
router.post("/can-order", cartController.canConvertToOrder);

/**
 * @route   POST /api/cart/merge
 * @desc    Merge duplicate items in cart
 * @access  Public
 * @body    { items: Array }
 */
router.post("/merge", cartController.mergeDuplicates);

/**
 * @route   POST /api/cart/calculate-item
 * @desc    Calculate single item price with modifiers
 * @access  Public
 * @body    { menuItemId: String, quantity: Number, modifiers: Array }
 */
router.post("/calculate-item", cartController.calculateItemPrice);

/**
 * @route   POST /api/cart/statistics
 * @desc    Get cart statistics
 * @access  Public
 * @body    { items: Array }
 */
router.post("/statistics", cartController.getStatistics);

module.exports = router;
