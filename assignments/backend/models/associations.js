const MenuItem = require("./MenuItem");
const MenuCategory = require("./MenuCategory");
const MenuItemPhoto = require("./MenuItemPhoto");
const ModifierGroup = require("./ModifierGroup");
const ModifierOption = require("./ModifierOption");
const MenuItemModifierGroup = require("./MenuItemModifierGroup");

// MenuItem belongs to MenuCategory
MenuItem.belongsTo(MenuCategory, {
    foreignKey: "category_id",
    as: "category",
});

// MenuCategory has many MenuItems
MenuCategory.hasMany(MenuItem, {
    foreignKey: "category_id",
    as: "items",
});

// MenuItem has many MenuItemPhotos
MenuItem.hasMany(MenuItemPhoto, {
    foreignKey: "menu_item_id",
    as: "photos",
    onDelete: "CASCADE",
});

// MenuItemPhoto belongs to MenuItem
MenuItemPhoto.belongsTo(MenuItem, {
    foreignKey: "menu_item_id",
    as: "menuItem",
});

// ModifierGroup has many ModifierOptions
ModifierGroup.hasMany(ModifierOption, {
    foreignKey: "group_id",
    as: "options",
    onDelete: "CASCADE",
});

// ModifierOption belongs to ModifierGroup
ModifierOption.belongsTo(ModifierGroup, {
    foreignKey: "group_id",
    as: "group",
});

// MenuItem belongsToMany ModifierGroup (many-to-many)
MenuItem.belongsToMany(ModifierGroup, {
    through: MenuItemModifierGroup,
    foreignKey: "menu_item_id",
    otherKey: "group_id",
    as: "modifierGroups",
});

// ModifierGroup belongsToMany MenuItem (many-to-many)
ModifierGroup.belongsToMany(MenuItem, {
    through: MenuItemModifierGroup,
    foreignKey: "group_id",
    otherKey: "menu_item_id",
    as: "menuItems",
});

module.exports = {
    MenuItem,
    MenuCategory,
    MenuItemPhoto,
    ModifierGroup,
    ModifierOption,
    MenuItemModifierGroup,
};

