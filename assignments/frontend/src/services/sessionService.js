import customerApi from "./customerApi";

export const createSession = async ({ tableId, customerId }) => {
  return customerApi.post("/sessions", { tableId, customerId });
};

export const getActiveSessionByTable = async (tableId) => {
  return customerApi.get(`/sessions/table/${tableId}`);
};

/**
 * Smart session check - returns both active and recent completed sessions
 * Used to detect post-payment mode vs ordering mode
 */
export const checkTableSessionStatus = async (tableId) => {
  return customerApi.get(`/sessions/table/${tableId}/check`);
};

/**
 * Claim/link session to customer (after login)
 */
export const claimSession = async (sessionId, customerId) => {
  return customerApi.post(`/sessions/${sessionId}/claim`, { customerId });
};

export const getSessionById = async (sessionId) => {
  return customerApi.get(`/sessions/${sessionId}`);
};

export const createOrderInSession = async (sessionId, items) => {
  return customerApi.post(`/sessions/${sessionId}/orders`, { items });
};

export const completeSession = async (sessionId, payload) => {
  return customerApi.post(`/sessions/${sessionId}/complete`, payload);
};
