const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * OrderItem Model
 * Items in an order - can be added multiple times
 */
const OrderItem = sequelize.define(
    "OrderItem",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: { msg: "Order ID is required" },
            },
        },
        menu_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: { msg: "Menu Item ID is required" },
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: { args: [1], msg: "Quantity must be at least 1" },
            },
        },
        unit_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: "Price at time of order (snapshot)",
        },
        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: "unit_price * quantity (excluding modifiers)",
        },
        total_price: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            comment: "Total including modifiers",
        },
        status: {
            type: DataTypes.ENUM(
                "pending",
                "confirmed",
                "preparing",
                "ready",
                "served",
                "cancelled"
            ),
            defaultValue: "pending",
        },
        special_instructions: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        item_name: {
            type: DataTypes.STRING(80),
            allowNull: false,
            comment: "Snapshot of item name",
        },
        item_description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        added_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "order_items",
        timestamps: true,
        underscored: true,
        indexes: [
            { name: "idx_order_items_order_id", fields: ["order_id"] },
            { name: "idx_order_items_menu_item_id", fields: ["menu_item_id"] },
            { name: "idx_order_items_status", fields: ["status"] },
        ],
    }
);

module.exports = OrderItem;