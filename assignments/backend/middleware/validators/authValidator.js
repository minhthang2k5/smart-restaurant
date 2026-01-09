const { body, validationResult } = require("express-validator");

/**
 * Validation middleware to check for errors
 * Should be used after validation rules
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      message: "Validation error",
      errors: errors.array().map((err) => ({
        // return only what fe needs
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
exports.registerValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 1, max: 50 }) // Changed from min: 2
    .withMessage("First name must be between 1 and 50 characters")
    .matches(/^[\p{L}\s]+$/u) // Changed regex to support Unicode letters
    .withMessage("First name can only contain letters and spaces"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 1, max: 50 }) // Changed from min: 2
    .withMessage("Last name must be between 1 and 50 characters")
    .matches(/^[\p{L}\s]+$/u) // Changed regex to support Unicode letters
    .withMessage("Last name can only contain letters and spaces"),
];

/**
 * Validation rules for user login
 */
exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("password").trim().notEmpty().withMessage("Password is required"),
];

/**
 * Validation rules for email verification
 */
exports.verifyEmailValidation = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required")
    .isLength({ min: 32, max: 255 })
    .withMessage("Invalid token format"),
];

/**
 * Validation rules for forgot password
 */
exports.forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address")
    .normalizeEmail(),
];

/**
 * Validation rules for reset password
 */
exports.resetPasswordValidation = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ min: 32, max: 255 })
    .withMessage("Invalid token format"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

/**
 * Validation rules for update password
 */
exports.updatePasswordValidation = [
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),
];
