import api from "./api";

// ========== CATEGORIES ==========
export const getCategories = async (params) => {
  return api.get("/admin/menu/categories", { params });
};

export const createCategory = async (data) => {
  return api.post("/admin/menu/categories", data);
};

export const updateCategory = async (id, data) => {
  return api.put(`/admin/menu/categories/${id}`, data);
};

export const deleteCategory = async (id) => {
  return api.delete(`/admin/menu/categories/${id}`);
};

// ========== MENU ITEMS ==========
export const getMenuItems = async (params) => {
  return api.get("/admin/menu/items", { params });
};

export const getMenuItemById = async (id) => {
  return api.get(`/admin/menu/items/${id}`);
};

export const createMenuItem = async (data) => {
  return api.post("/admin/menu/items", data);
};

export const updateMenuItem = async (id, data) => {
  return api.put(`/admin/menu/items/${id}`, data);
};

export const deleteMenuItem = async (id) => {
  return api.delete(`/admin/menu/items/${id}`);
};

// ========== MODIFIERS ==========
export const getModifierGroups = async () => {
  return api.get("/admin/menu/modifier-groups");
};

export const createModifierGroup = async (data) => {
  return api.post("/admin/menu/modifier-groups", data);
};

export const updateModifierGroup = async (id, data) => {
  return api.put(`/admin/menu/modifier-groups/${id}`, data);
};

export const deleteModifierGroup = async (id) => {
  return api.delete(`/admin/menu/modifier-groups/${id}`);
};

// Modifier Options
export const getModifierOptions = async (groupId) => {
  return api.get(`/admin/menu/modifier-groups/${groupId}/options`);
};

export const createModifierOption = async (groupId, data) => {
  return api.post(`/admin/menu/modifier-groups/${groupId}/options`, data);
};

export const updateModifierOption = async (id, data) => {
  return api.put(`/admin/menu/modifier-options/${id}`, data);
};

export const deleteModifierOption = async (id) => {
  return api.delete(`/admin/menu/modifier-options/${id}`);
};

// Attach modifiers to items
export const attachModifiersToItem = async (itemId, groupIds) => {
  return api.post(`/admin/menu/items/${itemId}/modifier-groups`, {
    groupIds: groupIds,
  });
};

export const getItemModifiers = async (itemId) => {
  return api.get(`/admin/menu/items/${itemId}/modifier-groups`);
};

// ========== PUBLIC MENU (Guest) ==========
export const getPublicMenu = async (params) => {
  return api.get("/menu/items", { params });
};

export const getPublicMenuItem = async (itemId) => {
  return api.get(`/menu/items/${itemId}`);
};

// ========== MENU ITEM PHOTOS ==========
export const uploadPhotos = async (itemId, files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("photos", file);
  });

  return api.post(`/admin/menu/items/${itemId}/photos`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deletePhoto = async (itemId, photoId) => {
  return api.delete(`/admin/menu/items/${itemId}/photos/${photoId}`);
};

export const setPrimaryPhoto = async (itemId, photoId) => {
  return api.patch(`/admin/menu/items/${itemId}/photos/${photoId}/primary`);
};
