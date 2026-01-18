const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const uploadService = require("../services/uploadService");
const { authenticate, authorize } = require("../middleware/auth");
const {
    createStaffValidation,
    updateStaffValidation,
    updateStaffStatusValidation,
    getStaffByIdValidation,
    deleteStaffValidation,
    updateProfileValidation,
    getStaffListValidation,
} = require("../middleware/validators/userValidator");
const { validate } = require("../middleware/validators/authValidator");


// ============================================
// Staff Management Routes (Admin Only)
// ============================================

/**
 * @route   POST /api/users/staff
 * @desc    Create a new staff member (Waiter, Kitchen Staff, or Admin)
 * @access  Admin only
 */
router.post(
    "/staff",
    authenticate,
    authorize(["admin"]),
    createStaffValidation,
    validate,
    userController.createStaff
);

/**
 * @route   GET /api/users/staff
 * @desc    Get all staff members with filtering
 * @access  Admin only
 * @query   role, status, search, page, limit
 */
router.get(
    "/staff",
    authenticate,
    authorize(["admin"]),
    getStaffListValidation,
    validate,
    userController.getAllStaff
);

/**
 * @route   GET /api/users/staff/:id
 * @desc    Get staff member by ID
 * @access  Admin only
 */
router.get(
    "/staff/:id",
    authenticate,
    authorize(["admin"]),
    getStaffByIdValidation,
    validate,
    userController.getStaffById
);

/**
 * @route   PUT /api/users/staff/:id
 * @desc    Update staff member details
 * @access  Admin only
 */
router.put(
    "/staff/:id",
    authenticate,
    authorize(["admin"]),
    updateStaffValidation,
    validate,
    userController.updateStaff
);

/**
 * @route   PATCH /api/users/staff/:id/status
 * @desc    Update staff member status (activate/deactivate)
 * @access  Admin only
 */
router.patch(
    "/staff/:id/status",
    authenticate,
    authorize(["admin"]),
    updateStaffStatusValidation,
    validate,
    userController.updateStaffStatus
);

/**
 * @route   DELETE /api/users/staff/:id
 * @desc    Delete staff member (soft delete)
 * @access  Admin only
 */
router.delete(
    "/staff/:id",
    authenticate,
    authorize(["admin"]),
    deleteStaffValidation,
    validate,
    userController.deleteStaff
);

// ============================================
// User Profile Routes (All Authenticated Users)
// ============================================

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (All authenticated users)
 */
router.get("/profile", authenticate, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private (All authenticated users)
 */
router.put(
    "/profile",
    authenticate,
    updateProfileValidation,
    validate,
    userController.updateProfile
);

/**
 * @route   POST /api/users/profile/avatar
 * @desc    Upload user avatar
 * @access  Private (All authenticated users)
 */
router.post(
    "/profile/avatar",
    authenticate,
    uploadService.photosUpload.single("avatar"),
    userController.uploadAvatar
);

module.exports = router;
