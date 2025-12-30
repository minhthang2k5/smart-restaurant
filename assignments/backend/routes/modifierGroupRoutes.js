const express = require("express");
const router = express.Router();
const modifierGroupController = require("../controllers/modifierGroupController");
const modifierOptionController = require("../controllers/modifierOptionController");
const { authenticate, authorize } = require("../middleware/auth");

// Apply authentication and authorization to all routes (Admin only)
router.use(authenticate);
router.use(authorize(["admin"]));

/**
 * @route   GET /api/admin/menu/modifier-groups
 * @desc    Get all modifier groups with filtering and sorting
 * @access  Private (Admin)
 * @query   status (optional) - Filter by status (active/inactive)
 * @query   sortBy (optional) - Sort by field (display_order, name, created_at)
 * @query   order (optional) - Sort order (ASC/DESC)
 */
router.get("/", modifierGroupController.getModifierGroups);

/**
 * @route   GET /api/admin/menu/modifier-groups/:id
 * @desc    Get a single modifier group by ID with options
 * @access  Private (Admin)
 */
router.get("/:id", modifierGroupController.getModifierGroupById);

/**
 * @route   POST /api/admin/menu/modifier-groups
 * @desc    Create a new modifier group
 * @access  Private (Admin)
 * @body    name (required), selection_type, is_required, min_selections, max_selections, display_order, status
 */
router.post("/", modifierGroupController.createModifierGroup);

/**
 * @route   PUT /api/admin/menu/modifier-groups/:id
 * @desc    Update a modifier group
 * @access  Private (Admin)
 * @body    name, selection_type, is_required, min_selections, max_selections, display_order, status
 */
router.put("/:id", modifierGroupController.updateModifierGroup);

/**
 * @route   PATCH /api/admin/menu/modifier-groups/:id/status
 * @desc    Update modifier group status (activate/deactivate)
 * @access  Private (Admin)
 * @body    status (required) - 'active' or 'inactive'
 */
router.patch("/:id/status", modifierGroupController.updateModifierGroupStatus);

/**
 * @route   DELETE /api/admin/menu/modifier-groups/:id
 * @desc    Soft delete a modifier group
 * @access  Private (Admin)
 */
router.delete("/:id", modifierGroupController.deleteModifierGroup);

/**
 * Modifier Options routes (nested under modifier groups)
 */

/**
 * @route   GET /api/admin/menu/modifier-groups/:id/options
 * @desc    Get all options for a modifier group
 * @access  Private (Admin)
 * @query   status (optional) - Filter by status (active/inactive)
 */
router.get("/:id/options", modifierOptionController.getModifierOptions);

/**
 * @route   POST /api/admin/menu/modifier-groups/:id/options
 * @desc    Create a new modifier option for a group
 * @access  Private (Admin)
 * @body    name (required), price_adjustment, status
 */
router.post("/:id/options", modifierOptionController.createModifierOption);

module.exports = router;

