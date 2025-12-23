const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MenuCategory = sequelize.define(
    "MenuCategory",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        restaurantId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "restaurant_id",
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                len: {
                    args: [2, 50],
                    msg: "Name must be between 2 and 50 characters",
                },
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: "display_order",
            validate: {
                min: {
                    args: [0],
                    msg: "Display order must be a non-negative integer",
                },
            },
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
        },
    },
    {
        timestamps: true,
        underscored: true,
        indexes: [
            {
                name: "idx_menu_categories_restaurant",
                fields: ["restaurant_id"],
            },
            {
                name: "idx_menu_categories_status",
                fields: ["status"],
            },
            {
                unique: true,
                name: "unique_restaurant_category_name",
                fields: ["restaurant_id", "name"],
            },
        ],
    }
);

module.exports = MenuCategory;
