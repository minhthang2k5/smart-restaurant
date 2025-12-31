const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * OrderItemModifier Model
 * Stores selected modifier options for each order item
 */
const OrderItemModifier = sequelize.define(
    "OrderItemModifier",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        order_item_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: { msg: "Order Item ID is required" },
            },
        },
        modifier_group_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        modifier_option_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        price_adjustment: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            comment: "Price adjustment snapshot",
        },
        group_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: "Snapshot of group name",
        },
        option_name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: "Snapshot of option name",
        },
    },
    {
        tableName: "order_item_modifiers",
        timestamps: true,
        underscored: true,
        indexes: [
            { name: "idx_order_item_modifiers_order_item_id", fields: ["order_item_id"] },
        ],
    }
);

module.exports = OrderItemModifier;