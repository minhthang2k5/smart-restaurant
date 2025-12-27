/**
 * Simple authentication middleware (temporary - for development only)
 * TODO: Replace with proper JWT authentication system
 */

// Hardcoded admin credentials (for development only)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

/**
 * Basic authentication middleware
 * Checks for Authorization header with Basic auth
 * Format: Authorization: Basic base64(username:password)
 */
exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return res.status(401).json({
            status: "fail",
            message: "Authentication required. Please provide credentials.",
        });
    }

    try {
        // Extract and decode credentials
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString(
            "utf-8"
        );
        const [username, password] = credentials.split(":");

        // Verify credentials
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            // Attach user info to request
            req.user = {
                username: username,
                role: "admin",
                restaurantId: "00000000-0000-0000-0000-000000000001", // Hardcoded restaurant ID
            };
            return next();
        }

        return res.status(401).json({
            status: "fail",
            message: "Invalid credentials",
        });
    } catch (error) {
        return res.status(401).json({
            status: "fail",
            message: "Invalid authorization header format",
        });
    }
};

/**
 * Authorization middleware - Check if user has admin role
 */
exports.authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            status: "fail",
            message: "Authentication required",
        });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({
            status: "fail",
            message: "Access denied. Admin privileges required.",
        });
    }

    next();
};

/**
 * Optional authentication - doesn't fail if no credentials provided
 * Useful for endpoints that work differently for authenticated users
 */
exports.optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return next();
    }

    try {
        const base64Credentials = authHeader.split(" ")[1];
        const credentials = Buffer.from(base64Credentials, "base64").toString(
            "utf-8"
        );
        const [username, password] = credentials.split(":");

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            req.user = {
                username: username,
                role: "admin",
                restaurantId: "00000000-0000-0000-0000-000000000001",
            };
        }
    } catch (error) {
        // Ignore errors in optional auth
    }

    next();
};
