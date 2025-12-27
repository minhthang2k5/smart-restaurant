const express = require("express");
const router = express.Router();
const menuCategoryController = require("../controllers/menuCategoryController");
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Apply authentication middleware to all admin routes
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route   GET /api/admin/menu/categories
 * @desc    Get all categories with filtering and sorting
 * @access  Private (Admin)
 * @query   status (optional) - Filter by status (active/inactive)
 * @query   sortBy (optional) - Sort by field (displayOrder, name, createdAt)
 * @query   order (optional) - Sort order (ASC/DESC)
 */
router.get("/", menuCategoryController.getCategories);

/**
 * @route   GET /api/admin/menu/categories/:id
 * @desc    Get a single category by ID
 * @access  Private (Admin)
 */
router.get("/:id", menuCategoryController.getCategoryById);

/**
 * @route   POST /api/admin/menu/categories
 * @desc    Create a new category
 * @access  Private (Admin)
 * @body    name (required), description, displayOrder, status
 */
router.post("/", menuCategoryController.createCategory);

/**
 * @route   PUT /api/admin/menu/categories/:id
 * @desc    Update a category
 * @access  Private (Admin)
 * @body    name, description, displayOrder, status
 */
router.put("/:id", menuCategoryController.updateCategory);

/**
 * @route   PATCH /api/admin/menu/categories/:id/status
 * @desc    Update category status (activate/deactivate)
 * @access  Private (Admin)
 * @body    status (required) - 'active' or 'inactive'
 */
router.patch("/:id/status", menuCategoryController.updateCategoryStatus);

/**
 * @route   DELETE /api/admin/menu/categories/:id
 * @desc    Soft delete a category
 * @access  Private (Admin)
 */
router.delete("/:id", menuCategoryController.deleteCategory);

module.exports = router;
