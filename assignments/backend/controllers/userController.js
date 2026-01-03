const userService = require("../services/userService");

/**
 * @desc    Create a new staff member (Waiter, Kitchen Staff, or Admin)
 * @route   POST /api/users/staff
 * @access  Admin only
 */
exports.createStaff = async (req, res) => {
    try {
        const staffData = req.body;
        const creatorRestaurantId = req.user.restaurantId;

        const staff = await userService.createStaff(
            staffData,
            creatorRestaurantId
        );

        res.status(201).json({
            status: "success",
            message: "Staff member created successfully",
            data: staff,
        });
    } catch (error) {
        console.error("Error creating staff:", error);

        // Handle business logic errors with statusCode
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        // Handle Sequelize validation errors
        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                status: "fail",
                message: "Validation error",
                errors: error.errors.map((e) => ({
                    field: e.path,
                    message: e.message,
                })),
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to create staff member",
            error: error.message,
        });
    }
};

/**
 * @desc    Get all staff members with filtering
 * @route   GET /api/users/staff
 * @access  Admin only
 */
exports.getAllStaff = async (req, res) => {
    try {
        const filters = req.query;
        const result = await userService.getAllStaff(filters);

        res.status(200).json({
            status: "success",
            results: result.staff.length,
            pagination: result.pagination,
            data: result.staff,
        });
    } catch (error) {
        console.error("Error fetching staff:", error);

        res.status(500).json({
            status: "error",
            message: "Failed to fetch staff members",
            error: error.message,
        });
    }
};

/**
 * @desc    Get staff member by ID
 * @route   GET /api/users/staff/:id
 * @access  Admin only
 */
exports.getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await userService.getStaffById(id);

        res.status(200).json({
            status: "success",
            data: staff,
        });
    } catch (error) {
        console.error("Error fetching staff:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to fetch staff member",
            error: error.message,
        });
    }
};

/**
 * @desc    Update staff member details
 * @route   PUT /api/users/staff/:id
 * @access  Admin only
 */
exports.updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const staff = await userService.updateStaff(id, updateData);

        res.status(200).json({
            status: "success",
            message: "Staff member updated successfully",
            data: staff,
        });
    } catch (error) {
        console.error("Error updating staff:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                status: "fail",
                message: "Validation error",
                errors: error.errors.map((e) => ({
                    field: e.path,
                    message: e.message,
                })),
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to update staff member",
            error: error.message,
        });
    }
};

/**
 * @desc    Update staff member status (activate/deactivate)
 * @route   PATCH /api/users/staff/:id/status
 * @access  Admin only
 */
exports.updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const staff = await userService.updateStaffStatus(id, status);

        res.status(200).json({
            status: "success",
            message: "Staff status updated successfully",
            data: staff,
        });
    } catch (error) {
        console.error("Error updating staff status:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to update staff status",
            error: error.message,
        });
    }
};

/**
 * @desc    Delete staff member (soft delete)
 * @route   DELETE /api/users/staff/:id
 * @access  Admin only
 */
exports.deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        const result = await userService.deleteStaff(id, currentUserId);

        res.status(200).json({
            status: "success",
            message: result.message,
        });
    } catch (error) {
        console.error("Error deleting staff:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to delete staff member",
            error: error.message,
        });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private (All authenticated users)
 */
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await userService.getUserProfile(userId);

        res.status(200).json({
            status: "success",
            data: profile,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to fetch user profile",
            error: error.message,
        });
    }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/profile
 * @access  Private (All authenticated users)
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        const profile = await userService.updateUserProfile(userId, updateData);

        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: profile,
        });
    } catch (error) {
        console.error("Error updating profile:", error);

        if (error.statusCode) {
            return res.status(error.statusCode).json({
                status: "fail",
                message: error.message,
            });
        }

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                status: "fail",
                message: "Validation error",
                errors: error.errors.map((e) => ({
                    field: e.path,
                    message: e.message,
                })),
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to update profile",
            error: error.message,
        });
    }
};
