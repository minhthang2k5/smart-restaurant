const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * PaymentTransaction Model
 * Audit log for all payment attempts and completions
 * Tracks payment history for reconciliation and debugging
 */
const PaymentTransaction = sequelize.define(
    "PaymentTransaction",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        table_session_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'table_sessions',
                key: 'id'
            },
            validate: {
                notNull: { msg: "Table session ID is required" },
            },
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: "Payment gateway used (momo, vnpay, etc.)",
        },
        transaction_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "External transaction ID from payment gateway",
        },
        request_id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "Request ID sent to payment gateway",
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            validate: { min: 0 },
            comment: "Payment amount",
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: "Transaction status (pending, completed, failed, cancelled)",
        },
        response_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "Response code from payment gateway",
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: "Message from payment gateway",
        },
        raw_response: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: "Full raw response from payment gateway",
        },
    },
    {
        tableName: "payment_transactions",
        timestamps: true,
        underscored: true,
        indexes: [
            { name: "idx_payment_transactions_session", fields: ["table_session_id"] },
            { name: "idx_payment_transactions_transaction", fields: ["transaction_id"] },
            { name: "idx_payment_transactions_request", fields: ["request_id"] },
            { name: "idx_payment_transactions_status", fields: ["status"] },
            { name: "idx_payment_transactions_created", fields: ["created_at"] },
        ],
    }
);

module.exports = PaymentTransaction;
