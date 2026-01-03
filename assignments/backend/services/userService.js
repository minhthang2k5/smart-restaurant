const User = require("../models/User");
const emailService = require("./emailService");
const { Op } = require("sequelize");
const APIFeatures = require("../utils/apiFeatures");

/**
 * Create a new staff member (Waiter, Kitchen Staff, or Admin)
 * Admin only - no email verification required for staff
 */
const createStaff = async (staffData, creatorRestaurantId) => {
    const { email, password, firstName, lastName, role, restaurantId } =
        staffData;

    // Validate role
    if (!["admin", "waiter", "kitchen_staff"].includes(role)) {
        const error = new Error(
            "Invalid role. Staff can only be admin, waiter, or kitchen_staff"
        );
        error.statusCode = 400;
        throw error;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 400;
        throw error;
    }

    // Create staff user (password will be hashed by beforeCreate hook)
    const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        role,
        restaurantId: restaurantId || creatorRestaurantId,
        emailVerified: true, // Staff accounts are pre-verified
        status: "active",
    });

    // Send welcome email (optional, don't fail if email fails)
    try {
        await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
    }

    return sanitizeUser(user);
};

/**
 * Get all staff members with filtering
 * Admin only
 */
const getAllStaff = async (filters = {}) => {
    const { role } = filters;

    // Base filter for staff roles only
    const baseWhere = {
        role: {
            [Op.in]: ["admin", "waiter", "kitchen_staff"],
        },
    };

    // Filter by specific role if provided
    if (role && ["admin", "waiter", "kitchen_staff"].includes(role)) {
        baseWhere.role = role;
    }

    // Build query using APIFeatures
    const features = new APIFeatures(User, filters)
        .filter(baseWhere)
        .searchFields(["firstName", "lastName", "email"], "search")
        .filterBy("status", "status")
        .paginate();

    // Set default ordering
    features.queryOptions.order = [["createdAt", "DESC"]];

    // Add attributes selection
    features.queryOptions.attributes = [
        "id",
        "email",
        "firstName",
        "lastName",
        "role",
        "restaurantId",
        "emailVerified",
        "avatar",
        "status",
        "lastLogin",
        "createdAt",
        "updatedAt",
    ];

    // Execute query
    const [users, totalCount] = await Promise.all([
        features.execute(),
        features.getCount(),
    ]);

    // Get pagination data
    const paginationData = features.getPaginationData(totalCount);

    return {
        staff: users,
        pagination: {
            page: paginationData.currentPage,
            limit: paginationData.itemsPerPage,
            totalPages: paginationData.totalPages,
            totalCount: paginationData.totalItems,
        },
    };
};

/**
 * Get staff member by ID
 * Admin only
 */
const getStaffById = async (staffId) => {
    const user = await User.findOne({
        where: {
            id: staffId,
            role: {
                [Op.in]: ["admin", "waiter", "kitchen_staff"],
            },
        },
        attributes: [
            "id",
            "email",
            "firstName",
            "lastName",
            "role",
            "restaurantId",
            "emailVerified",
            "avatar",
            "status",
            "lastLogin",
            "createdAt",
            "updatedAt",
        ],
    });

    if (!user) {
        const error = new Error("Staff member not found");
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Update staff member details
 * Admin only
 */
const updateStaff = async (staffId, updateData) => {
    const { email, firstName, lastName, role, restaurantId, status } =
        updateData;

    const user = await getStaffById(staffId);

    // Validate role if provided
    if (role && !["admin", "waiter", "kitchen_staff"].includes(role)) {
        const error = new Error(
            "Invalid role. Staff can only be admin, waiter, or kitchen_staff"
        );
        error.statusCode = 400;
        throw error;
    }

    // Validate status if provided
    if (status && !["active", "inactive"].includes(status)) {
        const error = new Error("Invalid status. Must be active or inactive");
        error.statusCode = 400;
        throw error;
    }

    // Check email uniqueness if changing
    if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            const error = new Error("Email already registered");
            error.statusCode = 400;
            throw error;
        }
        user.email = email;
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (restaurantId !== undefined) user.restaurantId = restaurantId;
    if (status) user.status = status;

    await user.save();

    return sanitizeUser(user);
};

/**
 * Update staff member status (activate/deactivate)
 * Admin only
 */
const updateStaffStatus = async (staffId, status) => {
    if (!["active", "inactive"].includes(status)) {
        const error = new Error("Invalid status. Must be active or inactive");
        error.statusCode = 400;
        throw error;
    }

    const user = await getStaffById(staffId);
    user.status = status;
    await user.save();

    return sanitizeUser(user);
};

/**
 * Delete staff member (soft delete)
 * Admin only
 */
const deleteStaff = async (staffId, currentUserId) => {
    // Prevent self-deletion
    if (staffId === currentUserId) {
        const error = new Error("You cannot delete your own account");
        error.statusCode = 400;
        throw error;
    }

    const user = await getStaffById(staffId);

    // Soft delete by setting status to inactive
    user.status = "inactive";
    await user.save();

    return { message: "Staff member deleted successfully" };
};

/**
 * Get user profile (any authenticated user)
 */
const getUserProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: [
            "id",
            "email",
            "firstName",
            "lastName",
            "role",
            "restaurantId",
            "emailVerified",
            "avatar",
            "status",
            "lastLogin",
            "createdAt",
        ],
    });

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Update user profile
 * Any authenticated user can update their own profile
 */
const updateUserProfile = async (userId, updateData) => {
    const { firstName, lastName } = updateData;

    const user = await User.findByPk(userId);

    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }

    // Only allow updating name fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    return sanitizeUser(user);
};

/**
 * Remove sensitive fields from user object
 */
const sanitizeUser = (user) => {
    const userObj = user.toJSON();
    delete userObj.password;
    delete userObj.emailVerificationToken;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    return userObj;
};

module.exports = {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    updateStaffStatus,
    deleteStaff,
    getUserProfile,
    updateUserProfile,
};
