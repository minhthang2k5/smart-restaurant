const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate, authorize } = require("../middleware/auth");

// ==================== PUBLIC ROUTES ====================

/**
 * Get reviews for a menu item (no auth required)
 * GET /api/menu-items/:itemId/reviews?page=1&limit=10&sort=recent
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - sort: recent | highest | lowest | helpful (default: recent)
 */
router.get("/menu-items/:itemId/reviews", reviewController.getItemReviews);

// ==================== CUSTOMER ROUTES ====================

// Apply authentication for all routes below
router.use(authenticate);

/**
 * Get completed sessions with reviewable items
 * GET /api/reviews/reviewable-sessions
 * Returns: List of completed sessions with review status for each item
 */
router.get(
    "/reviews/reviewable-sessions",
    authorize(["customer"]),
    reviewController.getReviewableSessions
);

/**
 * Get customer's own reviews
 * GET /api/reviews/my-reviews
 * Returns: All reviews created by logged-in customer
 */
router.get(
    "/reviews/my-reviews",
    authorize(["customer"]),
    reviewController.getMyReviews
);

/**
 * Create review for item in session
 * POST /api/sessions/:sessionId/items/:itemId/review
 * Body: { rating: 1-5, comment?: string }
 */
router.post(
    "/sessions/:sessionId/items/:itemId/review",
    authorize(["customer"]),
    reviewController.createReview
);

/**
 * Update own review
 * PUT /api/reviews/:id
 * Body: { rating?: 1-5, comment?: string }
 */
router.put(
    "/reviews/:id",
    authorize(["customer"]),
    reviewController.updateReview
);

/**
 * Delete own review (customer) or any review (admin)
 * DELETE /api/reviews/:id
 */
router.delete(
    "/reviews/:id",
    authorize(["customer", "admin"]),
    reviewController.deleteReview
);

module.exports = router;
