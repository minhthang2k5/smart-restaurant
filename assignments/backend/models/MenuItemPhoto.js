const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * MenuItemPhoto model
 * Represents a photo associated with a menu item.
 */
const MenuItemPhoto = sequelize.define(
    "MenuItemPhoto",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        menu_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: { msg: "menu_item_id is required" },
            },
        },
        url: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: { msg: "Photo url is required" },
                notEmpty: { msg: "Photo url cannot be empty" },
            },
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "menu_item_photos",
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = MenuItemPhoto;
