import React, { createContext, useContext, useMemo, useState } from "react";

const MenuContext = createContext(null);

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// ===== Mock data (UI-only)
const initialCategories = [
  { id: "c1", name: "Appetizers", status: "active" },
  { id: "c2", name: "Main Dishes", status: "active" },
  { id: "c3", name: "Drinks", status: "inactive" },
];

const initialModifierGroups = [
  {
    id: "g1",
    name: "Size",
    selectionType: "single",
    required: true,
    min: 1,
    max: 1,
    status: "active",
    options: [
      { id: "o1", name: "Small", priceAdjustment: 0, status: "active" },
      { id: "o2", name: "Large", priceAdjustment: 15000, status: "active" },
    ],
  },
  {
    id: "g2",
    name: "Toppings",
    selectionType: "multiple",
    required: false,
    min: 0,
    max: 3,
    status: "active",
    options: [
      { id: "o3", name: "Cheese", priceAdjustment: 8000, status: "active" },
      { id: "o4", name: "Bacon", priceAdjustment: 12000, status: "inactive" },
    ],
  },
];

const initialItems = [
  {
    id: "i1",
    name: "Fried Calamari",
    description: "Crispy calamari with dipping sauce",
    categoryId: "c1",
    price: 79000,
    prepTime: 10,
    status: "available", // available | sold_out | hidden
    chefRecommended: true,
    createdAt: "2025-12-01",
    modifierGroupIds: ["g1", "g2"],
  },
  {
    id: "i2",
    name: "Beef Steak",
    description: "Juicy steak with pepper sauce",
    categoryId: "c2",
    price: 199000,
    prepTime: 20,
    status: "sold_out",
    chefRecommended: false,
    createdAt: "2025-12-05",
    modifierGroupIds: ["g1"],
  },
];

export function MenuProvider({ children }) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [modifierGroups, setModifierGroups] = useState(initialModifierGroups);

  // ===== Categories (UI-only)
  function addCategory(data) {
    const c = { id: uid("c"), status: "active", ...data };
    setCategories((prev) => [c, ...prev]);
    return c;
  }
  function updateCategory(id, patch) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }
  function deleteCategory(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  // ===== Items (UI-only)
  function addItem(data) {
    const it = {
      id: uid("i"),
      createdAt: new Date().toISOString().slice(0, 10),
      modifierGroupIds: [],
      photos: [], 
      ...data,
    };
    setItems((prev) => [it, ...prev]);
    return it;
  }
  function updateItem(id, patch) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  }
  function deleteItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // ===== Modifiers (UI-only)
  function addModifierGroup(data) {
    const g = { id: uid("g"), status: "active", options: [], ...data };
    setModifierGroups((prev) => [g, ...prev]);
    return g;
  }
  function updateModifierGroup(groupId, patch) {
    setModifierGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g))
    );
  }
  function deleteModifierGroup(groupId) {
    setModifierGroups((prev) => prev.filter((g) => g.id !== groupId));
    // detach from items
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        modifierGroupIds: (it.modifierGroupIds || []).filter(
          (x) => x !== groupId
        ),
      }))
    );
  }

  function addModifierOption(groupId, data) {
    setModifierGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const opt = { id: uid("o"), status: "active", ...data };
        return { ...g, options: [opt, ...g.options] };
      })
    );
  }
  function updateModifierOption(groupId, optionId, patch) {
    setModifierGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((o) =>
            o.id === optionId ? { ...o, ...patch } : o
          ),
        };
      })
    );
  }
  function deleteModifierOption(groupId, optionId) {
    setModifierGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, options: g.options.filter((o) => o.id !== optionId) };
      })
    );
  }

  function setItemModifierGroups(itemId, groupIds) {
    updateItem(itemId, { modifierGroupIds: groupIds });
  }

  const value = useMemo(
    () => ({
      categories,
      items,
      modifierGroups,
      addCategory,
      updateCategory,
      deleteCategory,
      addItem,
      updateItem,
      deleteItem,
      addModifierGroup,
      updateModifierGroup,
      deleteModifierGroup,
      addModifierOption,
      updateModifierOption,
      deleteModifierOption,
      setItemModifierGroups,
    }),
    [categories, items, modifierGroups]
  );

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu must be used within MenuProvider");
  return ctx;
}
