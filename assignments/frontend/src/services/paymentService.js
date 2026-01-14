import api from "./api";

export const initiateMoMoPayment = async (sessionId) => {
  return api.post(`/sessions/${sessionId}/payment/momo/initiate`);
};

export const getPaymentStatus = async (sessionId) => {
  return api.get(`/sessions/${sessionId}/payment/status`);
};

export const cancelMoMoPayment = async (sessionId, payload) => {
  return api.post(`/sessions/${sessionId}/payment/momo/cancel`, payload);
};

export const processMoMoCallback = async (payload) => {
  return api.post(`/payment/momo/callback`, payload);
};
