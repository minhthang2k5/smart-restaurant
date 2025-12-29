const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
    registerValidation,
    loginValidation,
    verifyEmailValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    updatePasswordValidation,
    validate,
} = require("../middleware/validators/authValidator");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account
 * @access  Public
 */
router.post("/register", registerValidation, validate, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post("/login", loginValidation, validate, authController.login);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post(
    "/verify-email",
    verifyEmailValidation,
    validate,
    authController.verifyEmail
);

/**
 * @route   GET /api/auth/check-email
 * @desc    Check if email is available
 * @access  Public
 */
router.get("/check-email", authController.checkEmailAvailability);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (sends email with reset token)
 * @access  Public
 */
router.post(
    "/forgot-password",
    forgotPasswordValidation,
    validate,
    authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token from email
 * @access  Public
 */
router.post(
    "/reset-password",
    resetPasswordValidation,
    validate,
    authController.resetPassword
);

/**
 * @route   PUT /api/auth/update-password
 * @desc    Update password (requires old password verification)
 * @access  Private (requires authentication)
 */
router.put(
    "/update-password",
    authenticate,
    updatePasswordValidation,
    validate,
    authController.updatePassword
);

module.exports = router;
