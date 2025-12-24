const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MenuItem = sequelize.define(
  "MenuItem",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
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
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Category is required",
        },
      },
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Name cannot be empty",
        },
        len: {
          args: [2, 80],
          msg: "Name must be between 2 and 80 characters",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: "Price is required",
        },
        min: {
          args: [0.01],
          msg: "Price must be greater than 0",
        },
        isDecimal: {
          msg: "Price must be a valid decimal number",
        },
      },
    },
    prep_time_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Preparation time cannot be negative",
        },
        max: {
          args: [240],
          msg: "Preparation time cannot exceed 240 minutes",
        },
        isInt: {
          msg: "Preparation time must be a whole number",
        },
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "available",
      validate: {
        isIn: {
          args: [["available", "unavailable", "sold_out"]],
          msg: "Status must be one of: available, unavailable, sold_out",
        },
      },
    },
    is_chef_recommended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "menu_items",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = MenuItem;
