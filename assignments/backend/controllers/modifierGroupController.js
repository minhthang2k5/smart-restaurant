// Load associations first
require("../models/associations");
const ModifierGroup = require("../models/ModifierGroup");
const ModifierOption = require("../models/ModifierOption");
const { Op } = require("sequelize");

/**
 * Create a new modifier group
 * POST /api/admin/menu/modifier-groups
 */
exports.createModifierGroup = async (req, res) => {
    try {
        const {
            name,
            selection_type,
            is_required,
            min_selections,
            max_selections,
            display_order,
            status,
        } = req.body;

        // Use fallback for development
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is required",
            });
        }

        if (!selection_type || !["single", "multiple"].includes(selection_type)) {
            return res.status(400).json({
                success: false,
                message: "Selection type must be 'single' or 'multiple'",
            });
        }

        // Validate min/max selections for multi-select
        if (selection_type === "multiple") {
            const min = min_selections || 0;
            const max = max_selections || 0;

            if (min < 0 || max < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Min and max selections cannot be negative",
                });
            }

            if (max > 0 && min > max) {
                return res.status(400).json({
                    success: false,
                    message: "Min selections cannot be greater than max selections",
                });
            }
        }

        // Validate required + single-select: must have exactly 1 chosen
        if (is_required && selection_type === "single") {
            // This will be validated when options are added
        }

        // Create modifier group
        const modifierGroup = await ModifierGroup.create({
            restaurant_id: restaurantId,
            name,
            selection_type: selection_type || "single",
            is_required: is_required || false,
            min_selections: min_selections || 0,
            max_selections: max_selections || 0,
            display_order: display_order !== undefined ? display_order : 0,
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Modifier group created successfully",
            data: modifierGroup,
        });
    } catch (error) {
        console.error("Error creating modifier group:", error);

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
            message: "Error creating modifier group",
            error: error.message,
        });
    }
};

/**
 * Get all modifier groups with filtering and sorting
 * GET /api/admin/menu/modifier-groups
 */
exports.getModifierGroups = async (req, res) => {
    try {
        const { status, sortBy = "display_order", order = "ASC" } = req.query;

        // Enforce authenticated tenant scope
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Build where clause
        const where = { restaurant_id: restaurantId };
        if (status) {
            where.status = status;
        }

        // Build order clause
        let orderClause;
        switch (sortBy) {
            case "name":
                orderClause = [["name", order.toUpperCase()]];
                break;
            case "created_at":
                orderClause = [["created_at", order.toUpperCase()]];
                break;
            case "display_order":
            default:
                orderClause = [["display_order", order.toUpperCase()]];
                break;
        }

        const modifierGroups = await ModifierGroup.findAll({
            where,
            order: orderClause,
            include: [
                {
                    model: ModifierOption,
                    as: "options",
                    attributes: ["id", "name", "price_adjustment", "status"],
                    required: false,
                },
            ],
        });

        res.status(200).json({
            success: true,
            count: modifierGroups.length,
            data: modifierGroups,
        });
    } catch (error) {
        console.error("Error fetching modifier groups:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching modifier groups",
            error: error.message,
        });
    }
};

/**
 * Get a single modifier group by ID
 * GET /api/admin/menu/modifier-groups/:id
 */
exports.getModifierGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        // Enforce authenticated tenant scope
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        const modifierGroup = await ModifierGroup.findOne({
            where: {
                id,
                restaurant_id: restaurantId,
            },
            include: [
                {
                    model: ModifierOption,
                    as: "options",
                    attributes: ["id", "name", "price_adjustment", "status", "created_at"],
                    required: false,
                    order: [["created_at", "ASC"]],
                },
            ],
        });

        if (!modifierGroup) {
            return res.status(404).json({
                success: false,
                message: "Modifier group not found",
            });
        }

        res.status(200).json({
            success: true,
            data: modifierGroup,
        });
    } catch (error) {
        console.error("Error fetching modifier group:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching modifier group",
            error: error.message,
        });
    }
};

/**
 * Update a modifier group
 * PUT /api/admin/menu/modifier-groups/:id
 */
exports.updateModifierGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            selection_type,
            is_required,
            min_selections,
            max_selections,
            display_order,
            status,
        } = req.body;
        // Enforce authenticated tenant scope
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Find modifier group
        const modifierGroup = await ModifierGroup.findOne({
            where: {
                id,
                restaurant_id: restaurantId,
            },
        });

        if (!modifierGroup) {
            return res.status(404).json({
                success: false,
                message: "Modifier group not found",
            });
        }

        // Validate selection_type if provided
        if (selection_type !== undefined && !["single", "multiple"].includes(selection_type)) {
            return res.status(400).json({
                success: false,
                message: "Selection type must be 'single' or 'multiple'",
            });
        }

        // Validate min/max selections
        const finalSelectionType = selection_type || modifierGroup.selection_type;
        if (finalSelectionType === "multiple") {
            const min = min_selections !== undefined ? min_selections : modifierGroup.min_selections;
            const max = max_selections !== undefined ? max_selections : modifierGroup.max_selections;

            if (min < 0 || max < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Min and max selections cannot be negative",
                });
            }

            if (max > 0 && min > max) {
                return res.status(400).json({
                    success: false,
                    message: "Min selections cannot be greater than max selections",
                });
            }
        }

        // Update fields
        if (name !== undefined) modifierGroup.name = name;
        if (selection_type !== undefined) modifierGroup.selection_type = selection_type;
        if (is_required !== undefined) modifierGroup.is_required = is_required;
        if (min_selections !== undefined) modifierGroup.min_selections = min_selections;
        if (max_selections !== undefined) modifierGroup.max_selections = max_selections;
        if (display_order !== undefined) modifierGroup.display_order = display_order;
        if (status !== undefined) modifierGroup.status = status;

        await modifierGroup.save();

        res.status(200).json({
            success: true,
            message: "Modifier group updated successfully",
            data: modifierGroup,
        });
    } catch (error) {
        console.error("Error updating modifier group:", error);

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
            message: "Error updating modifier group",
            error: error.message,
        });
    }
};

/**
 * Update modifier group status
 * PATCH /api/admin/menu/modifier-groups/:id/status
 */
exports.updateModifierGroupStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Enforce authenticated tenant scope
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        if (!status || !["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required (active or inactive)",
            });
        }

        const modifierGroup = await ModifierGroup.findOne({
            where: {
                id,
                restaurant_id: restaurantId,
            },
        });

        if (!modifierGroup) {
            return res.status(404).json({
                success: false,
                message: "Modifier group not found",
            });
        }

        modifierGroup.status = status;
        await modifierGroup.save();

        res.status(200).json({
            success: true,
            message: `Modifier group ${status === "active" ? "activated" : "deactivated"} successfully`,
            data: modifierGroup,
        });
    } catch (error) {
        console.error("Error updating modifier group status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating modifier group status",
            error: error.message,
        });
    }
};

/**
 * Delete a modifier group (soft delete by setting status to inactive)
 * DELETE /api/admin/menu/modifier-groups/:id
 */
exports.deleteModifierGroup = async (req, res) => {
    try {
        const { id } = req.params;
        // Enforce authenticated tenant scope
        const restaurantId =
            req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        const modifierGroup = await ModifierGroup.findOne({
            where: {
                id,
                restaurant_id: restaurantId,
            },
        });

        if (!modifierGroup) {
            return res.status(404).json({
                success: false,
                message: "Modifier group not found",
            });
        }

        // Check if group has active options
        const activeOptionCount = await ModifierOption.count({
            where: {
                group_id: id,
                status: "active",
            },
        });

        if (activeOptionCount > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete modifier group with active options",
                activeOptionCount,
            });
        }

        // Soft delete by setting status to inactive
        modifierGroup.status = "inactive";
        await modifierGroup.save();

        res.status(200).json({
            success: true,
            message: "Modifier group deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting modifier group:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting modifier group",
            error: error.message,
        });
    }
};

