import customerApi from "./customerApi";

/**
 * Get all reviews for a menu item (public)
 */
export const getItemReviews = async (itemId) => {
  return customerApi.get(`/menu-items/${itemId}/reviews`);
};

/**
 * Get sessions that are reviewable for the logged-in customer
 */
export const getReviewableSessions = async () => {
  return customerApi.get("/reviews/reviewable-sessions");
};

/**
 * Get customer's own reviews
 */
export const getMyReviews = async () => {
  return customerApi.get("/reviews/my-reviews");
};

/**
 * Create a review for a menu item in a session
 */
export const createReview = async (sessionId, itemId, reviewData) => {
  return customerApi.post(
    `/sessions/${sessionId}/items/${itemId}/review`,
    reviewData
  );
};

/**
 * Update an existing review
 */
export const updateReview = async (reviewId, reviewData) => {
  return customerApi.put(`/reviews/${reviewId}`, reviewData);
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId) => {
  return customerApi.delete(`/reviews/${reviewId}`);
};

export default {
  getItemReviews,
  getReviewableSessions,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
};
