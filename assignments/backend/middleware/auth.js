const passport = require("passport");

/**
 * Authenticate user using JWT token
 * Extracts token from Authorization header: "Bearer <token>"
 */
exports.authenticate = (req, res, next) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                status: "error",
                message: "Authentication error",
            });
        }

        if (!user) {
            return res.status(401).json({
                status: "fail",
                message: "Unauthorized. Please log in to access this resource.",
            });
        }

        req.user = user;
        next();
    })(req, res, next);
};

/**
 * Role-based access control middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles (e.g., ['admin', 'waiter'])
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/tables', authenticate, authorize(['admin', 'waiter']), createTable);
 */
exports.authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: "fail",
                message: "Unauthorized. Please log in first.",
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: "fail",
                message: `Forbidden. This action requires one of the following roles: ${allowedRoles.join(
                    ", "
                )}`,
            });
        }

        next();
    };
};

