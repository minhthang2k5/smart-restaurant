import api from "./api";

export const getOrders = async ({ status, tableId, date, limit } = {}) => {
  const params = {};
  if (status && status !== "all") params.status = status;
  if (tableId) params.tableId = tableId;
  if (date) params.date = date;
  if (limit) params.limit = limit;

  return api.get("/orders", { params });
};

export const acceptOrder = async (orderId, waiterId) => {
  const body = waiterId ? { waiterId } : {};
  return api.post(`/orders/${orderId}/accept`, body);
};

export const rejectOrder = async (orderId, reason, waiterId) => {
  const body = {
    ...(reason ? { reason } : {}),
    ...(waiterId ? { waiterId } : {}),
  };
  return api.post(`/orders/${orderId}/reject`, body);
};

export const updateOrderStatus = async (orderId, status) => {
  return api.patch(`/orders/${orderId}/status`, { status });
};

export const completeOrder = async (orderId) => {
  return api.post(`/orders/${orderId}/complete`);
};
