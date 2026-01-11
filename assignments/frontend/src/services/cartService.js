import api from "./api";

const CART_STORAGE_KEY = "cart";

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeModifiers = (modifiers) => {
  if (!Array.isArray(modifiers)) return [];
  return modifiers
    .map((m) => (m && typeof m === "object" ? m.optionId : null))
    .filter(Boolean)
    .sort();
};

const makeItemSignature = (item) => {
  const modifiers = normalizeModifiers(item.modifiers);
  const specialInstructions = item.specialInstructions || "";
  return `${item.menuItemId}::${specialInstructions}::${modifiers.join(",")}`;
};

// =====================
// Local (client-side) cart storage
// =====================
export const getLocalCartItems = () => {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  const items = safeJsonParse(raw, []);
  return Array.isArray(items) ? items : [];
};

export const setLocalCartItems = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items || []));
  window.dispatchEvent(new Event("cart:updated"));
};

export const clearLocalCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("cart:updated"));
};

export const getLocalCartCount = () => {
  const items = getLocalCartItems();
  return items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
};

export const addToLocalCart = (newItem) => {
  const itemToAdd = {
    menuItemId: newItem.menuItemId,
    quantity: Number(newItem.quantity || 1),
    specialInstructions: newItem.specialInstructions || null,
    modifiers: Array.isArray(newItem.modifiers) ? newItem.modifiers : [],
  };

  const items = getLocalCartItems();
  const signature = makeItemSignature(itemToAdd);

  const index = items.findIndex((it) => makeItemSignature(it) === signature);
  if (index >= 0) {
    const merged = {
      ...items[index],
      quantity: Number(items[index].quantity || 0) + itemToAdd.quantity,
    };
    const next = [...items];
    next[index] = merged;
    setLocalCartItems(next);
    return next;
  }

  const next = [...items, itemToAdd];
  setLocalCartItems(next);
  return next;
};

export const updateLocalCartItemQuantity = (index, quantity) => {
  const items = getLocalCartItems();
  if (index < 0 || index >= items.length) return items;

  const nextQty = Math.max(1, Number(quantity || 1));
  const next = [...items];
  next[index] = { ...next[index], quantity: nextQty };
  setLocalCartItems(next);
  return next;
};

export const removeLocalCartItem = (index) => {
  const items = getLocalCartItems();
  const next = items.filter((_, i) => i !== index);
  setLocalCartItems(next);
  return next;
};

// =====================
// Server-side Cart APIs
// =====================
export const validateCart = async (items) => {
  return api.post("/cart/validate", { items });
};

export const getCartSummary = async (items) => {
  return api.post("/cart/summary", { items });
};

export const canOrder = async (items) => {
  return api.post("/cart/can-order", { items });
};

export const mergeDuplicates = async (items) => {
  return api.post("/cart/merge", { items });
};

export const calculateItemPrice = async (payload) => {
  return api.post("/cart/calculate-item", payload);
};

export const getCartStatistics = async (items) => {
  return api.post("/cart/statistics", { items });
};
