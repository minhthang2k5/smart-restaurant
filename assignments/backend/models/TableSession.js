const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * TableSession Model
 * Represents a dining session at a table
 * Groups multiple orders together for combined payment
 */
const TableSession = sequelize.define(
    "TableSession",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
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
            comment: "Primary customer for this session",
        },
        session_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: "Format: SESS-YYYYMMDD-XXXX",
        },
        status: {
            type: DataTypes.ENUM(
                "active",      // Currently serving
                "completed",   // Payment completed
                "cancelled"    // Cancelled (customer didn't show)
            ),
            defaultValue: "active",
        },
        started_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        // Combined totals from all orders in this session
        subtotal: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 },
            comment: "Sum of all orders subtotal",
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
            comment: "Final amount to pay",
        },
        payment_method: {
            type: DataTypes.ENUM("cash", "card", "zalopay", "momo", "vnpay", "stripe"),
            allowNull: true,
        },
        payment_status: {
            type: DataTypes.ENUM("unpaid", "paid", "refunded"),
            defaultValue: "unpaid",
        },
        payment_transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "External payment gateway transaction ID",
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Special notes about this session",
        },
    },
    {
        tableName: "table_sessions",
        timestamps: true,
        underscored: true,
        indexes: [
            { name: "idx_sessions_table_id", fields: ["table_id"] },
            { name: "idx_sessions_table_status", fields: ["table_id", "status"] },
            { name: "idx_sessions_customer_id", fields: ["customer_id"] },
            { name: "idx_sessions_status", fields: ["status"] },
        ],
    }
);

module.exports = TableSession;
