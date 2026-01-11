import api from "./api";

export const getOrdersByTable = async (tableId) => {
  return api.get(`/orders/table/${tableId}`);
};

export const getOrderById = async (orderId) => {
  return api.get(`/orders/${orderId}`);
};
