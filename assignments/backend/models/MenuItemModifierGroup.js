const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MenuItemModifierGroup = sequelize.define(
    "MenuItemModifierGroup",
    {
        menu_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
        },
        group_id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
        },
    },
    {
        tableName: "menu_item_modifier_groups",
        timestamps: false,
        underscored: true,
    }
);

module.exports = MenuItemModifierGroup;

