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
            comment: "Format: SESS-YYYYMMDD-HHMMSS-XXXXXX (timestamp + random)",
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
            type: DataTypes.ENUM("unpaid", "pending", "paid", "failed", "refunded"),
            defaultValue: "unpaid",
        },
        payment_transaction_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "External payment gateway transaction ID",
        },
        momo_request_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "MoMo request ID for tracking",
        },
        momo_order_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "MoMo order ID for tracking",
        },
        momo_transaction_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            comment: "MoMo transaction ID (unique, for idempotency)",
        },
        momo_payment_status: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "MoMo payment status message",
        },
        momo_payment_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            comment: "Amount sent to MoMo for payment",
        },
        momo_payment_time: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "When MoMo payment was completed",
        },
        momo_response_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "MoMo result code",
        },
        momo_signature: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "MoMo callback signature for verification",
        },
        momo_extra_data: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Extra data sent with MoMo request",
        },
        momo_error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Error message from MoMo if payment failed",
        },
        momo_raw_response: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "Full raw response from MoMo API",
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
