const MenuItem = require("./MenuItem");
const ModifierGroup = require("./ModifierGroup");
const ModifierOption = require("./ModifierOption");
const MenuItemModifierGroup = require("./MenuItemModifierGroup");

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
    ModifierGroup,
    ModifierOption,
    MenuItemModifierGroup,
};

