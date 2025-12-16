const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Table = sequelize.define(
    "Table",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        tableNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: "table_number", // Map với tên cột trong DB chuẩn snake_case
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 20 },
        },
        description: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
        },
        qrToken: {
            type: DataTypes.TEXT, // Token có thể dài
            field: "qr_token",
        },
        qrTokenCreatedAt: {
            type: DataTypes.DATE,
            field: "qr_token_created_at",
        },
    },
    {
        timestamps: true, // Tự động tạo created_at, updated_at
        underscored: true, // Chuyển camelCase thành snake_case trong DB
        indexes: [
            // This creates the index on the 'status' column
            {
                name: "idx_tables_status",
                fields: ["status"],
            },
            // This creates the index on the 'location' column
            {
                name: "idx_tables_location",
                fields: ["location"],
            },
        ],
    }
);

module.exports = Table;
