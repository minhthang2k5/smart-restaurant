const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
    registerValidation,
    loginValidation,
    verifyEmailValidation,
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

module.exports = router;
