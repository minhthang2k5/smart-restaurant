const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Review Model
 * Represents customer reviews for menu items
 * One customer can review same item multiple times (different sessions)
 */
const Review = sequelize.define(
    "Review",
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
                notNull: {
                    msg: "Menu item ID is required",
                },
            },
        },
        customer_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Customer ID is required",
                },
            },
        },
        session_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Session ID is required",
                },
            },
        },
        order_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: "Link to specific order (optional)",
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Rating is required",
                },
                min: {
                    args: [1],
                    msg: "Rating must be at least 1",
                },
                max: {
                    args: [5],
                    msg: "Rating cannot exceed 5",
                },
                isInt: {
                    msg: "Rating must be a whole number",
                },
            },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        helpful_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: "Helpful count cannot be negative",
                },
            },
        },
        status: {
            type: DataTypes.ENUM("pending", "approved", "rejected"),
            defaultValue: "approved",
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Status is required",
                },
                isIn: {
                    args: [["pending", "approved", "rejected"]],
                    msg: "Status must be one of: pending, approved, rejected",
                },
            },
        },
    },
    {
        tableName: "reviews",
        timestamps: true,
        underscored: true,
        indexes: [
            // Unique constraint: one review per item per session per customer
            {
                unique: true,
                fields: ["menu_item_id", "customer_id", "session_id"],
                name: "reviews_unique_per_session",
            },
            // Index for queries
            { fields: ["menu_item_id"] },
            { fields: ["customer_id"] },
            { fields: ["session_id"] },
            { fields: ["status"] },
            { fields: ["rating"] },
        ],
    }
);

module.exports = Review;
