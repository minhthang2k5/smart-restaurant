const reviewService = require("../services/reviewService");

/**
 * Get reviews for a menu item (PUBLIC)
 * GET /api/menu-items/:itemId/reviews?page=1&limit=10&sort=recent
 */
exports.getItemReviews = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { page = 1, limit = 10, sort = "recent" } = req.query;
        
        const data = await reviewService.getItemReviews(itemId, { page, limit, sort });
        
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Get item reviews error:", error);
        const status = error.message === "Menu item not found" ? 404 : 500;
        res.status(status).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Create review for item in completed session
 * POST /api/sessions/:sessionId/items/:itemId/review
 * Body: { rating, comment }
 */
exports.createReview = async (req, res) => {
    try {
        const { sessionId, itemId } = req.params;
        const { rating, comment } = req.body;
        
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(sessionId) || !uuidRegex.test(itemId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID or item ID format"
            });
        }
        
        const customerId = req.user.id;
        
        const reviewWithData = await reviewService.createReview(
            sessionId, 
            itemId, 
            customerId, 
            { rating, comment }
        );
        
        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: reviewWithData
        });
        
    } catch (error) {
        console.error("Create review error:", error);
        
        // Handle specific errors
        let status = 500;
        let response = { success: false, message: error.message };
        
        if (error.message.includes("not found")) status = 404;
        else if (error.message.includes("Rating must be") || 
                 error.message.includes("only review") ||
                 error.message.includes("didn't order")) status = 400;
        else if (error.message.includes("already reviewed")) {
            status = 400;
            response.reviewId = error.reviewId;
        }
        
        res.status(status).json(response);
    }
};

/**
 * Get completed sessions with reviewable items
 * GET /api/reviews/reviewable-sessions
 */
exports.getReviewableSessions = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const sessionsWithReviewStatus = await reviewService.getReviewableSessions(customerId);
        
        res.status(200).json({
            success: true,
            data: sessionsWithReviewStatus
        });
        
    } catch (error) {
        console.error("Get reviewable sessions error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update own review
 * PUT /api/reviews/:id
 * Body: { rating, comment }
 */
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const customerId = req.user.id;
        
        const review = await reviewService.updateReview(id, customerId, { rating, comment });
        
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review
        });
        
    } catch (error) {
        console.error("Update review error:", error);
        
        let status = 500;
        if (error.message === "Review not found") status = 404;
        else if (error.message.includes("only update your own") || 
                 error.message.includes("Rating must be")) status = 403;
        
        res.status(status).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Delete own review
 * DELETE /api/reviews/:id
 */
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const customerId = req.user.id;
        const userRole = req.user.role;
        
        const result = await reviewService.deleteReview(id, customerId, userRole);
        
        res.status(200).json({
            success: true,
            message: result.message
        });
        
    } catch (error) {
        console.error("Delete review error:", error);
        
        let status = 500;
        if (error.message === "Review not found") status = 404;
        else if (error.message === "Unauthorized") status = 403;
        
        res.status(status).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get customer's own reviews
 * GET /api/reviews/my-reviews
 */
exports.getMyReviews = async (req, res) => {
    try {
        const customerId = req.user.id;
        
        const reviews = await reviewService.getCustomerReviews(customerId);
        
        res.status(200).json({
            success: true,
            data: reviews
        });
        
    } catch (error) {
        console.error("Get my reviews error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = exports;
