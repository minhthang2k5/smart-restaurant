const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                notNull: {
                    msg: "Email is required",
                },
                notEmpty: {
                    msg: "Email cannot be empty",
                },
                isEmail: {
                    msg: "Must be a valid email address",
                },
            },
            field: "email",
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Password is required",
                },
                notEmpty: {
                    msg: "Password cannot be empty",
                },
                len: {
                    args: [8, 255],
                    msg: "Password must be at least 8 characters",
                },
            },
            field: "password",
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notNull: {
                    msg: "First name is required",
                },
                notEmpty: {
                    msg: "First name cannot be empty",
                },
                len: {
                    args: [2, 50],
                    msg: "First name must be between 2 and 50 characters",
                },
            },
            field: "first_name",
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notNull: {
                    msg: "Last name is required",
                },
                notEmpty: {
                    msg: "Last name cannot be empty",
                },
                len: {
                    args: [2, 50],
                    msg: "Last name must be between 2 and 50 characters",
                },
            },
            field: "last_name",
        },
        role: {
            type: DataTypes.ENUM(
                "admin",
                "waiter",
                "kitchen_staff",
                "customer"
            ),
            allowNull: false,
            defaultValue: "customer",
            validate: {
                notNull: {
                    msg: "Role is required",
                },
                isIn: {
                    args: [["admin", "waiter", "kitchen_staff", "customer"]],
                    msg: "Role must be one of: admin, waiter, kitchen_staff, customer",
                },
            },
            field: "role",
        },
        restaurantId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "restaurant_id",
        },
        emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: "email_verified",
        },
        emailVerificationToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "email_verification_token",
        },
        passwordResetToken: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "password_reset_token",
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "password_reset_expires",
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "avatar",
        },
        status: {
            type: DataTypes.ENUM("active", "inactive"),
            defaultValue: "active",
            validate: {
                isIn: {
                    args: [["active", "inactive"]],
                    msg: "Status must be either active or inactive",
                },
            },
            field: "status",
        },
        lastLogin: {
            type: DataTypes.DATE,
            allowNull: true,
            field: "last_login",
        },
        googleId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            field: "google_id",
        },
    },
    {
        tableName: "users",
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password && user.password !== "GOOGLE_OAUTH") {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (
                    user.changed("password") &&
                    user.password !== "GOOGLE_OAUTH"
                ) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

// Instance method to verify password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate email verification token
User.prototype.generateVerificationToken = function () {
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    this.emailVerificationToken = token;
    return token;
};

// Instance method to generate password reset token
User.prototype.generatePasswordResetToken = function () {
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return token;
};

module.exports = User;
