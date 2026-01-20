/**
 * Bill Service
 * API calls for bill request feature (mock feature)
 */
import api from "./api";

/**
 * Request bill for a session (customer action)
 * @param {string} sessionId - UUID of the session
 * @returns {Promise} API response
 */
export const requestBill = async (sessionId) => {
  return api.post(`/sessions/${sessionId}/request-bill`);
};

/**
 * Get all pending bill requests (waiter dashboard)
 * @returns {Promise} List of pending bill requests
 */
export const getPendingBillRequests = async () => {
  return api.get("/sessions/waiter/bill-requests");
};

/**
 * Get bill preview for a session
 * @param {string} sessionId - UUID of the session
 * @returns {Promise} Bill preview data
 */
export const getBillPreview = async (sessionId) => {
  return api.get(`/sessions/${sessionId}/bill-preview`);
};

/**
 * Clear bill request (waiter action)
 * @param {string} sessionId - UUID of the session
 * @returns {Promise} API response
 */
export const clearBillRequest = async (sessionId) => {
  return api.patch(`/sessions/${sessionId}/clear-bill-request`);
};

export default {
  requestBill,
  getPendingBillRequests,
  getBillPreview,
  clearBillRequest,
};
