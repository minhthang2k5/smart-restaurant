const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ModifierGroup = sequelize.define(
  "ModifierGroup",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    restaurant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Restaurant ID is required",
        },
      },
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Group name cannot be empty",
        },
        len: {
          args: [1, 80],
          msg: "Group name must be between 1 and 80 characters",
        },
      },
    },
    selection_type: {
      type: DataTypes.ENUM("single", "multiple"),
      allowNull: false,
      defaultValue: "single",
      validate: {
        isIn: {
          args: [["single", "multiple"]],
          msg: "Selection type must be 'single' or 'multiple'",
        },
      },
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    min_selections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Min selections cannot be negative",
        },
      },
    },
    max_selections: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Max selections cannot be negative",
        },
      },
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
    tableName: "modifier_groups",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "idx_modifier_groups_restaurant",
        fields: ["restaurant_id"],
      },
      {
        name: "idx_modifier_groups_status",
        fields: ["status"],
      },
    ],
  }
);

// Associations will be set up after all models are loaded
module.exports = ModifierGroup;
