// Load associations first
require("../models/associations");
const ModifierOption = require("../models/ModifierOption");
const ModifierGroup = require("../models/ModifierGroup");

/**
 * Create a new modifier option
 * POST /api/admin/menu/modifier-groups/:id/options
 */
exports.createModifierOption = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { name, price_adjustment, status } = req.body;

        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Option name is required",
            });
        }

        // Verify modifier group exists and belongs to restaurant
        const modifierGroup = await ModifierGroup.findOne({
            where: {
                id: groupId,
                restaurant_id: restaurantId,
            },
        });

        if (!modifierGroup) {
            return res.status(404).json({
                success: false,
                message: "Modifier group not found",
            });
        }

        // Validate price adjustment
        const priceAdjustment = price_adjustment !== undefined ? price_adjustment : 0;
        if (priceAdjustment < 0) {
            return res.status(400).json({
                success: false,
                message: "Price adjustment cannot be negative",
            });
        }

        // Create modifier option
        const modifierOption = await ModifierOption.create({
            group_id: groupId,
            name,
            price_adjustment: priceAdjustment,
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Modifier option created successfully",
            data: modifierOption,
        });
    } catch (error) {
        console.error("Error creating modifier option:", error);

        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: messages,
            });
        }

        res.status(500).json({
            success: false,
            message: "Error creating modifier option",
            error: error.message,
        });
    }
};

/**
 * Get all options for a modifier group
 * GET /api/admin/menu/modifier-groups/:id/options
 */
exports.getModifierOptions = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const { status } = req.query;

        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Verify modifier group exists and belongs to restaurant
        const modifierGroup = await ModifierGroup.findOne({
            where: {
                id: groupId,
                restaurant_id: restaurantId,
            },
        });

        if (!modifierGroup) {
            return res.status(404).json({
                success: false,
                message: "Modifier group not found",
            });
        }

        // Build where clause
        const where = { group_id: groupId };
        if (status) {
            where.status = status;
        }

        const options = await ModifierOption.findAll({
            where,
            order: [["created_at", "ASC"]],
        });

        res.status(200).json({
            success: true,
            count: options.length,
            data: options,
        });
    } catch (error) {
        console.error("Error fetching modifier options:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching modifier options",
            error: error.message,
        });
    }
};

/**
 * Get a single modifier option by ID
 * GET /api/admin/menu/modifier-options/:id
 */
exports.getModifierOptionById = async (req, res) => {
    try {
        const { id } = req.params;
        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        const modifierOption = await ModifierOption.findOne({
            where: { id },
            include: [
                {
                    model: ModifierGroup,
                    as: "group",
                    attributes: ["id", "name", "restaurant_id"],
                    where: {
                        restaurant_id: restaurantId,
                    },
                    required: true,
                },
            ],
        });

        if (!modifierOption) {
            return res.status(404).json({
                success: false,
                message: "Modifier option not found",
            });
        }

        res.status(200).json({
            success: true,
            data: modifierOption,
        });
    } catch (error) {
        console.error("Error fetching modifier option:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching modifier option",
            error: error.message,
        });
    }
};

/**
 * Update a modifier option
 * PUT /api/admin/menu/modifier-options/:id
 */
exports.updateModifierOption = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price_adjustment, status } = req.body;
        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Find modifier option and verify it belongs to restaurant
        const modifierOption = await ModifierOption.findOne({
            where: { id },
            include: [
                {
                    model: ModifierGroup,
                    as: "group",
                    attributes: ["id", "restaurant_id"],
                    where: {
                        restaurant_id: restaurantId,
                    },
                    required: true,
                },
            ],
        });

        if (!modifierOption) {
            return res.status(404).json({
                success: false,
                message: "Modifier option not found",
            });
        }

        // Validate price adjustment if provided
        if (price_adjustment !== undefined && price_adjustment < 0) {
            return res.status(400).json({
                success: false,
                message: "Price adjustment cannot be negative",
            });
        }

        // Update fields
        if (name !== undefined) modifierOption.name = name;
        if (price_adjustment !== undefined) modifierOption.price_adjustment = price_adjustment;
        if (status !== undefined) modifierOption.status = status;

        await modifierOption.save();

        res.status(200).json({
            success: true,
            message: "Modifier option updated successfully",
            data: modifierOption,
        });
    } catch (error) {
        console.error("Error updating modifier option:", error);

        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((err) => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: messages,
            });
        }

        res.status(500).json({
            success: false,
            message: "Error updating modifier option",
            error: error.message,
        });
    }
};

/**
 * Update modifier option status
 * PATCH /api/admin/menu/modifier-options/:id/status
 */
exports.updateModifierOptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        if (!status || !["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required (active or inactive)",
            });
        }

        const modifierOption = await ModifierOption.findOne({
            where: { id },
            include: [
                {
                    model: ModifierGroup,
                    as: "group",
                    attributes: ["id", "restaurant_id"],
                    where: {
                        restaurant_id: restaurantId,
                    },
                    required: true,
                },
            ],
        });

        if (!modifierOption) {
            return res.status(404).json({
                success: false,
                message: "Modifier option not found",
            });
        }

        modifierOption.status = status;
        await modifierOption.save();

        res.status(200).json({
            success: true,
            message: `Modifier option ${status === "active" ? "activated" : "deactivated"} successfully`,
            data: modifierOption,
        });
    } catch (error) {
        console.error("Error updating modifier option status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating modifier option status",
            error: error.message,
        });
    }
};

/**
 * Delete a modifier option
 * DELETE /api/admin/menu/modifier-options/:id
 */
exports.deleteModifierOption = async (req, res) => {
    try {
        const { id } = req.params;
        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        const modifierOption = await ModifierOption.findOne({
            where: { id },
            include: [
                {
                    model: ModifierGroup,
                    as: "group",
                    attributes: ["id", "restaurant_id"],
                    where: {
                        restaurant_id: restaurantId,
                    },
                    required: true,
                },
            ],
        });

        if (!modifierOption) {
            return res.status(404).json({
                success: false,
                message: "Modifier option not found",
            });
        }

        // Soft delete by setting status to inactive
        modifierOption.status = "inactive";
        await modifierOption.save();

        res.status(200).json({
            success: true,
            message: "Modifier option deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting modifier option:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting modifier option",
            error: error.message,
        });
    }
};

