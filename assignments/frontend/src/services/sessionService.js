import api from "./api";

export const createSession = async ({ tableId, customerId }) => {
  return api.post("/sessions", { tableId, customerId });
};

export const getActiveSessionByTable = async (tableId) => {
  return api.get(`/sessions/table/${tableId}`);
};

export const getSessionById = async (sessionId) => {
  return api.get(`/sessions/${sessionId}`);
};

export const createOrderInSession = async (sessionId, items) => {
  return api.post(`/sessions/${sessionId}/orders`, { items });
};

export const completeSession = async (sessionId, payload) => {
  return api.post(`/sessions/${sessionId}/complete`, payload);
};
