import customerApi from "./customerApi";

export const initiateMoMoPayment = async (sessionId) => {
  return customerApi.post(`/sessions/${sessionId}/payment/momo/initiate`);
};

export const getPaymentStatus = async (sessionId) => {
  return customerApi.get(`/sessions/${sessionId}/payment/status`);
};

export const cancelMoMoPayment = async (sessionId, payload) => {
  return customerApi.post(`/sessions/${sessionId}/payment/momo/cancel`, payload);
};

export const processMoMoCallback = async (payload) => {
  return customerApi.post(`/payment/momo/callback`, payload);
};
