const express = require("express");
const router = express.Router();
const modifierOptionController = require("../controllers/modifierOptionController");
const { authenticate, authorize } = require("../middleware/auth");

// Apply authentication and authorization to all routes (Admin only)
router.use(authenticate);
router.use(authorize(["admin"]));

/**
 * @route   GET /api/admin/menu/modifier-options/:id
 * @desc    Get a single modifier option by ID
 * @access  Private (Admin)
 */
router.get("/:id", modifierOptionController.getModifierOptionById);

/**
 * @route   PUT /api/admin/menu/modifier-options/:id
 * @desc    Update a modifier option
 * @access  Private (Admin)
 * @body    name, price_adjustment, status
 */
router.put("/:id", modifierOptionController.updateModifierOption);

/**
 * @route   PATCH /api/admin/menu/modifier-options/:id/status
 * @desc    Update modifier option status (activate/deactivate)
 * @access  Private (Admin)
 * @body    status (required) - 'active' or 'inactive'
 */
router.patch("/:id/status", modifierOptionController.updateModifierOptionStatus);

/**
 * @route   DELETE /api/admin/menu/modifier-options/:id
 * @desc    Soft delete a modifier option
 * @access  Private (Admin)
 */
router.delete("/:id", modifierOptionController.deleteModifierOption);

module.exports = router;

