import api from "./api";

// ========== CATEGORIES ==========
export const getCategories = async (params) => {
  const response = await api.get("/admin/menu/categories", { params });
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post("/admin/menu/categories", data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.put(`/admin/menu/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/admin/menu/categories/${id}`);
  return response.data;
};

// ========== MENU ITEMS ==========
export const getMenuItems = async (params) => {
  const response = await api.get("/admin/menu/items", { params });
  return response; // { status, results, pagination, data }
};

export const getMenuItemById = async (id) => {
  const response = await api.get(`/admin/menu/items/${id}`);
  return response.data;
};

export const createMenuItem = async (data) => {
  const response = await api.post("/admin/menu/items", data);
  return response.data;
};

export const updateMenuItem = async (id, data) => {
  const response = await api.put(`/admin/menu/items/${id}`, data);
  return response.data;
};

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/admin/menu/items/${id}`);
  return response.data;
};

// ========== MODIFIERS ==========
export const getModifierGroups = async () => {
  const response = await api.get("/admin/menu/modifier-groups");
  return response.data;
};

export const createModifierGroup = async (data) => {
  const response = await api.post("/admin/menu/modifier-groups", data);
  return response.data;
};

export const updateModifierGroup = async (id, data) => {
  const response = await api.put(`/admin/menu/modifier-groups/${id}`, data);
  return response.data;
};

// ========== PUBLIC MENU ==========
export const getPublicMenu = async (params) => {
  const response = await api.get("/menu", { params });
  return response.data;
};
