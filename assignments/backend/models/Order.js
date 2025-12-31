const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Order Model
 * Represents a single order within a table session
 * Each order can be accepted independently by waiter
 * Multiple orders grouped in a TableSession for combined payment
 */
const Order = sequelize.define(
    "Order",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        session_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: "Links to TableSession for grouped payment",
        },
        restaurant_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        table_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: { msg: "Table ID is required" },
            },
        },
        customer_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        order_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM(
                "pending",
                "accepted",
                "rejected",
                "preparing",
                "ready",
                "served",
                "completed"
            ),
            defaultValue: "pending",
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 },
        },
        tax_amount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 },
        },
        discount_amount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 },
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 },
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        waiter_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        accepted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "orders",
        timestamps: true,
        underscored: true,
        indexes: [
            { name: "idx_orders_session_id", fields: ["session_id"] },
            { name: "idx_orders_table_id", fields: ["table_id"] },
            { name: "idx_orders_status", fields: ["status"] },
            { name: "idx_orders_order_number", fields: ["order_number"] },
        ],
    }
);

module.exports = Order;