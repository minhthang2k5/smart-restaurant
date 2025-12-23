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
  return response.data;
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

export const deleteModifierGroup = async (id) => {
  const response = await api.delete(`/admin/menu/modifier-groups/${id}`);
  return response.data;
};

// Modifier Options
export const getModifierOptions = async (groupId) => {
  const response = await api.get(
    `/admin/menu/modifier-groups/${groupId}/options`
  );
  return response.data;
};

export const createModifierOption = async (groupId, data) => {
  const response = await api.post(
    `/admin/menu/modifier-groups/${groupId}/options`,
    data
  );
  return response.data;
};

export const updateModifierOption = async (id, data) => {
  const response = await api.put(`/admin/menu/modifier-options/${id}`, data);
  return response.data;
};

export const deleteModifierOption = async (id) => {
  const response = await api.delete(`/admin/menu/modifier-options/${id}`);
  return response.data;
};

// Attach modifiers to items
export const attachModifiersToItem = async (itemId, groupIds) => {
  const response = await api.post(
    `/admin/menu/items/${itemId}/modifier-groups`,
    {
      group_ids: groupIds,
    }
  );
  return response.data;
};

export const getItemModifiers = async (itemId) => {
  const response = await api.get(`/admin/menu/items/${itemId}/modifier-groups`);
  return response.data;
};

// ========== PUBLIC MENU (Guest) ==========
export const getPublicMenu = async (params) => {
  const response = await api.get("/menu", { params });
  return response.data;
};

export const getPublicMenuItem = async (itemId) => {
  const response = await api.get(`/menu/items/${itemId}`);
  return response.data;
};
