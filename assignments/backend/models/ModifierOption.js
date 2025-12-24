const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ModifierOption = sequelize.define(
    "ModifierOption",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        group_id: {
            type: DataTypes.UUID,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Group ID is required",
                },
            },
        },
        name: {
            type: DataTypes.STRING(80),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Option name cannot be empty",
                },
                len: {
                    args: [1, 80],
                    msg: "Option name must be between 1 and 80 characters",
                },
            },
        },
        price_adjustment: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: "Price adjustment cannot be negative",
                },
            },
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
        },
    },
    {
        tableName: "modifier_options",
        timestamps: true,
        underscored: true,
        createdAt: "created_at",
        updatedAt: false, // No updated_at for options
        indexes: [
            {
                name: "idx_modifier_options_group",
                fields: ["group_id"],
            },
            {
                name: "idx_modifier_options_status",
                fields: ["status"],
            },
        ],
    }
);

// Associations will be set up after all models are loaded
module.exports = ModifierOption;

