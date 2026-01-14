import api from "./api";

export const getRevenueReport = async (params) => {
  return api.get("/reports/revenue", { params });
};

export const getTopItemsReport = async (params) => {
  return api.get("/reports/top-items", { params });
};

export const getChartDataReport = async (params) => {
  return api.get("/reports/chart-data", { params });
};
