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

