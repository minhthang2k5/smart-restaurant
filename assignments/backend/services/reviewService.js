const Review = require("../models/Review");
const MenuItem = require("../models/MenuItem");
const TableSession = require("../models/TableSession");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const User = require("../models/User");
const Table = require("../models/Table");
const { Op } = require("sequelize");

class ReviewService {
    /**
     * Get reviews for a menu item with pagination and sorting
     */
    async getItemReviews(itemId, { page = 1, limit = 10, sort = "recent" }) {
        const offset = (page - 1) * limit;
        
        // Sort options
        let order = [["created_at", "DESC"]]; // recent (default)
        if (sort === "highest") order = [["rating", "DESC"], ["created_at", "DESC"]];
        if (sort === "lowest") order = [["rating", "ASC"], ["created_at", "DESC"]];
        if (sort === "helpful") order = [["helpful_count", "DESC"], ["created_at", "DESC"]];
        
        // Check if menu item exists
        const menuItem = await MenuItem.findByPk(itemId);
        if (!menuItem) {
            throw new Error("Menu item not found");
        }
        
        const { rows: reviews, count } = await Review.findAndCountAll({
            where: {
                menu_item_id: itemId,
                status: "approved"
            },
            include: [
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "firstName", "lastName"]
                },
                {
                    model: TableSession,
                    as: "session",
                    attributes: ["id", "created_at"],
                    include: [{
                        model: Table,
                        as: "table",
                        attributes: ["table_number"]
                    }]
                }
            ],
            order,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: [
                "id",
                "rating",
                "comment",
                "helpful_count",
                "created_at"
            ]
        });
        
        // Calculate stats for all reviews (not just current page)
        const allReviews = await Review.findAll({
            where: {
                menu_item_id: itemId,
                status: "approved"
            },
            attributes: ["rating"]
        });
        
        const stats = {
            totalReviews: allReviews.length,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        if (allReviews.length > 0) {
            const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
            stats.averageRating = sum / allReviews.length;
            
            allReviews.forEach(r => {
                stats.ratingDistribution[r.rating]++;
            });
        }
        
        // Format customer names
        const formattedReviews = reviews.map(review => {
            const reviewData = review.toJSON();
            if (reviewData.customer) {
                reviewData.customer.name = `${reviewData.customer.firstName || ''} ${reviewData.customer.lastName || ''}`.trim();
            }
            return reviewData;
        });
        
        return {
            reviews: formattedReviews,
            stats,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Create a review for item in completed session
     */
    async createReview(sessionId, itemId, customerId, { rating, comment }) {
        // Validation
        if (!rating || rating < 1 || rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }
        
        // Check menu item exists
        const menuItem = await MenuItem.findByPk(itemId);
        if (!menuItem) {
            throw new Error("Menu item not found");
        }
        
        // Check session exists and belongs to customer
        const session = await TableSession.findOne({
            where: {
                id: sessionId,
                customer_id: customerId
            },
            include: [{
                model: Order,
                as: "orders",
                include: [{
                    model: OrderItem,
                    as: "items",
                    where: { menu_item_id: itemId }
                }]
            }]
        });
        
        if (!session) {
            throw new Error("Session not found or you don't have permission");
        }
        
        // Check session is completed
        if (session.status !== "completed") {
            throw new Error("You can only review items from completed sessions");
        }
        
        // Check customer ordered this item in this session
        const hasItem = session.orders.some(order => 
            order.items.some(item => item.menu_item_id === itemId)
        );
        
        if (!hasItem) {
            throw new Error("You didn't order this item in this session");
        }
        
        // Check if already reviewed
        const existingReview = await Review.findOne({
            where: {
                menu_item_id: itemId,
                customer_id: customerId,
                session_id: sessionId
            }
        });
        
        if (existingReview) {
            const error = new Error("You already reviewed this item for this visit");
            error.reviewId = existingReview.id;
            throw error;
        }
        
        // Get order_id if available
        const orderId = session.orders.find(order =>
            order.items.some(item => item.menu_item_id === itemId)
        )?.id || null;
        
        // Create review
        const review = await Review.create({
            menu_item_id: itemId,
            customer_id: customerId,
            session_id: sessionId,
            order_id: orderId,
            rating: parseInt(rating),
            comment: comment || null,
            status: "approved"
        });
        
        // Fetch with relations
        const reviewWithData = await Review.findByPk(review.id, {
            include: [
                {
                    model: User,
                    as: "customer",
                    attributes: ["id", "firstName", "lastName"]
                },
                {
                    model: MenuItem,
                    as: "menuItem",
                    attributes: ["id", "name"]
                }
            ]
        });
        
        return reviewWithData;
    }

    /**
     * Get completed sessions with reviewable items for a customer
     */
    async getReviewableSessions(customerId) {
        const sessions = await TableSession.findAll({
            where: {
                customer_id: customerId,
                status: "completed"
            },
            include: [
                {
                    model: Table,
                    as: "table",
                    attributes: ["id", "table_number"]
                },
                {
                    model: Order,
                    as: "orders",
                    include: [{
                        model: OrderItem,
                        as: "items",
                        include: [{
                            model: MenuItem,
                            as: "menuItem",
                            attributes: ["id", "name", "price"]
                        }]
                    }]
                }
            ],
            order: [["completed_at", "DESC"]],
            limit: 20
        });
        
        // Add review status for each item
        const sessionsWithReviewStatus = await Promise.all(
            sessions.map(async (session) => {
                const sessionData = session.toJSON();
                
                // Get reviews for this session
                const reviews = await Review.findAll({
                    where: {
                        session_id: session.id,
                        customer_id: customerId
                    }
                });
                
                const reviewedItemIds = reviews.map(r => r.menu_item_id);
                
                // Mark items as reviewed
                sessionData.orders = sessionData.orders.map(order => ({
                    ...order,
                    items: order.items.map(item => ({
                        ...item,
                        reviewed: reviewedItemIds.includes(item.menu_item_id),
                        reviewId: reviews.find(r => r.menu_item_id === item.menu_item_id)?.id || null
                    }))
                }));
                
                return sessionData;
            })
        );
        
        return sessionsWithReviewStatus;
    }

    /**
     * Update a review (only by owner)
     */
    async updateReview(reviewId, customerId, { rating, comment }) {
        const review = await Review.findByPk(reviewId);
        
        if (!review) {
            throw new Error("Review not found");
        }
        
        // Check ownership
        if (review.customer_id !== customerId) {
            throw new Error("You can only update your own reviews");
        }
        
        // Validate rating
        if (rating && (rating < 1 || rating > 5)) {
            throw new Error("Rating must be between 1 and 5");
        }
        
        await review.update({
            rating: rating || review.rating,
            comment: comment !== undefined ? comment : review.comment
        });
        
        return review;
    }

    /**
     * Delete a review (owner or admin)
     */
    async deleteReview(reviewId, customerId, userRole) {
        const review = await Review.findByPk(reviewId);
        
        if (!review) {
            throw new Error("Review not found");
        }
        
        // Check ownership or admin
        if (review.customer_id !== customerId && userRole !== "admin") {
            throw new Error("Unauthorized");
        }
        
        await review.destroy();
        
        return { message: "Review deleted successfully" };
    }

    /**
     * Get all reviews by a customer
     */
    async getCustomerReviews(customerId) {
        const reviews = await Review.findAll({
            where: { customer_id: customerId },
            attributes: ["id", "rating", "comment", "created_at", "updated_at"],
            include: [
                {
                    model: MenuItem,
                    as: "menuItem",
                    attributes: ["id", "name", "price"]
                },
                {
                    model: TableSession,
                    as: "session",
                    attributes: ["id", "session_number", "completed_at"]
                }
            ],
            order: [["created_at", "DESC"]]
        });
        
        return reviews;
    }
}

module.exports = new ReviewService();
