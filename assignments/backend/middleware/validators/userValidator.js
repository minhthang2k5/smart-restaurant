const { body, param, query } = require("express-validator");

/**
 * Validation middleware for staff creation
 */
exports.createStaffValidation = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Must be a valid email address")
        .normalizeEmail(),

    body("password")
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
        .isLength({ min: 2, max: 50 })
        .withMessage("First name must be between 2 and 50 characters"),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage("Last name must be between 2 and 50 characters"),

    body("role")
        .notEmpty()
        .withMessage("Role is required")
        .isIn(["admin", "waiter", "kitchen_staff"])
        .withMessage("Role must be one of: admin, waiter, kitchen_staff"),

    body("restaurantId")
        .optional({ nullable: true })
        .isUUID()
        .withMessage("Restaurant ID must be a valid UUID"),
];

/**
 * Validation middleware for staff update
 */
exports.updateStaffValidation = [
    param("id").isUUID().withMessage("Invalid staff ID"),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Must be a valid email address")
        .normalizeEmail(),

    body("firstName")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("First name must be between 2 and 50 characters"),

    body("lastName")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Last name must be between 2 and 50 characters"),

    body("role")
        .optional()
        .isIn(["admin", "waiter", "kitchen_staff"])
        .withMessage("Role must be one of: admin, waiter, kitchen_staff"),

    body("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either active or inactive"),

    body("restaurantId")
        .optional({ nullable: true })
        .isUUID()
        .withMessage("Restaurant ID must be a valid UUID"),
];

/**
 * Validation middleware for staff status update
 */
exports.updateStaffStatusValidation = [
    param("id").isUUID().withMessage("Invalid staff ID"),

    body("status")
        .notEmpty()
        .withMessage("Status is required")
        .isIn(["active", "inactive"])
        .withMessage("Status must be either active or inactive"),
];

/**
 * Validation middleware for getting staff by ID
 */
exports.getStaffByIdValidation = [
    param("id").isUUID().withMessage("Invalid staff ID"),
];

/**
 * Validation middleware for deleting staff
 */
exports.deleteStaffValidation = [
    param("id").isUUID().withMessage("Invalid staff ID"),
];

/**
 * Validation middleware for profile update
 */
exports.updateProfileValidation = [
    body("firstName")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("First name must be between 2 and 50 characters"),

    body("lastName")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage("Last name must be between 2 and 50 characters"),
];

/**
 * Validation middleware for staff list query parameters
 */
exports.getStaffListValidation = [
    query("role")
        .optional()
        .isIn(["admin", "waiter", "kitchen_staff"])
        .withMessage("Role must be one of: admin, waiter, kitchen_staff"),

    query("status")
        .optional()
        .isIn(["active", "inactive"])
        .withMessage("Status must be either active or inactive"),

    query("search").optional().trim(),

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
];
