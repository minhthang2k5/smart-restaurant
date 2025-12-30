const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const emailService = require("../services/emailService");
const { Op } = require("sequelize");

/**
 * Register a new customer account
 * Sends email verification link
 *
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: "fail",
                message: "Email already registered",
            });
        }

        // Create new user (password will be hashed by beforeCreate hook)
        const user = await User.create({
            email,
            password,
            firstName,
            lastName,
            role: "customer", // Registration is only for customers
            emailVerified: false,
        });

        // Generate verification token
        const verificationToken = user.generateVerificationToken();
        await user.save();

        // Send verification email
        try {
            await emailService.sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // Don't fail the registration if email fails
        }

        res.status(201).json({
            status: "success",
            message:
                "Registration successful! Please check your email to verify your account.",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    emailVerified: user.emailVerified,
                },
            },
        });
    } catch (error) {
        console.error("Register error:", error);

        // Handle Sequelize validation errors
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                status: "fail",
                message: "Validation error",
                errors: error.errors.map((err) => ({
                    field: err.path,
                    message: err.message,
                })),
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to register user. Please try again later.",
        });
    }
};

/**
 * Login with email and password
 * Uses passport local strategy
 *
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = (req, res, next) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
        if (err) {
            console.error("Login authentication error:", err);
            return res.status(500).json({
                status: "error",
                message: "Authentication error. Please try again.",
            });
        }

        if (!user) {
            return res.status(401).json({
                status: "fail",
                message: info?.message || "Invalid credentials",
            });
        }

        try {
            // Generate JWT token
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
                process.env.JWT_AUTH_SECRET,
                {
                    expiresIn: process.env.JWT_AUTH_EXPIRES_IN || "7d",
                }
            );

            res.status(200).json({
                status: "success",
                message: "Login successful",
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        avatar: user.avatar,
                        emailVerified: user.emailVerified,
                    },
                },
            });
        } catch (tokenError) {
            console.error("Token generation error:", tokenError);
            return res.status(500).json({
                status: "error",
                message: "Failed to generate authentication token",
            });
        }
    })(req, res, next);
};

/**
 * Verify email with token
 * Activates user account
 *
 * @route POST /api/auth/verify-email
 * @access Public
 */
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        // Find user with matching verification token
        const user = await User.findOne({
            where: {
                emailVerificationToken: token,
                emailVerified: false,
            },
        });

        if (!user) {
            return res.status(400).json({
                status: "fail",
                message:
                    "Invalid or expired verification token. Please request a new one.",
            });
        }

        // Verify email
        user.emailVerified = true;
        user.emailVerificationToken = null;
        await user.save();

        // Send welcome email (optional, don't fail if it doesn't send)
        try {
            await emailService.sendWelcomeEmail(user);
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
        }

        // Generate JWT token for immediate login
        const authToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_AUTH_SECRET,
            {
                expiresIn: process.env.JWT_AUTH_EXPIRES_IN || "7d",
            }
        );

        res.status(200).json({
            status: "success",
            message: "Email verified successfully! You are now logged in.",
            data: {
                token: authToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    avatar: user.avatar,
                    emailVerified: user.emailVerified,
                },
            },
        });
    } catch (error) {
        console.error("Verify email error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to verify email. Please try again later.",
        });
    }
};

/**
 * Check if email is available (not already registered)
 * Used for real-time validation during registration
 *
 * @route GET /api/auth/check-email?email=user@example.com
 * @access Public
 */
exports.checkEmailAvailability = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                status: "fail",
                message: "Email is required",
            });
        }

        const existingUser = await User.findOne({ where: { email } });

        res.status(200).json({
            status: "success",
            data: {
                available: !existingUser,
                message: existingUser
                    ? "Email is already registered"
                    : "Email is available",
            },
        });
    } catch (error) {
        console.error("Check email error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to check email availability",
        });
    }
};


/**
 * Request password reset
 * Sends password reset email
 *
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });

        // Always return success even if user not found (security)
        if (!user) {
            return res.status(200).json({
                status: "success",
                message:
                    "If an account with that email exists, a password reset link has been sent.",
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send password reset email
        try {
            await emailService.sendPasswordResetEmail(user, resetToken);
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            return res.status(500).json({
                status: "error",
                message: "Failed to send password reset email",
            });
        }

        res.status(200).json({
            status: "success",
            message:
                "If an account with that email exists, a password reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to process password reset request",
        });
    }
};

/**
 * Reset password with token
 *
 * @route POST /api/auth/reset-password
 * @access Public
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            where: {
                passwordResetToken: token,
                passwordResetExpires: {
                    [Op.gt]: new Date(),
                },
            },
        });

        if (!user) {
            return res.status(400).json({
                status: "fail",
                message: "Invalid or expired reset token",
            });
        }

        // Update password (will be hashed by beforeUpdate hook)
        user.password = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        res.status(200).json({
            status: "success",
            message:
                "Password reset successful! You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to reset password. Please try again.",
        });
    }
};

/**
 * Update password (requires old password verification)
 *
 * @route PUT /api/auth/update-password
 * @access Private (requires authentication)
 */
exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        // Verify old password
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(401).json({
                status: "fail",
                message: "Current password is incorrect",
            });
        }

        // Update password (will be hashed by beforeUpdate hook)
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            status: "success",
            message: "Password updated successfully",
        });
    } catch (error) {
        console.error("Update password error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to update password",
        });
    }
};

/**
 * Logout user by invalidating current token
 * Sets passwordChangedAt to current time, making all existing tokens invalid
 *
 * @route POST /api/auth/logout
 * @access Private (requires authentication)
 */
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                status: "fail",
                message: "User not found",
            });
        }

        // Invalidate all tokens by updating passwordChangedAt
        user.passwordChangedAt = new Date();
        await user.save({ hooks: false }); // Skip password hashing hook

        res.status(200).json({
            status: "success",
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to logout",
        });
    }
};