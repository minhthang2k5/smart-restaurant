const MenuCategory = require("../models/MenuCategory");
const { Op } = require("sequelize");

/**
 * Create a new menu category
 * POST /api/admin/menu/categories
 */
exports.createCategory = async (req, res) => {
    try {
        const { name, description, displayOrder, status } = req.body;

        // Use fallback for development
        const restaurantId = req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

        // Validation
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name is required",
            });
        }

        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 50 characters",
            });
        }

        // Check if category name already exists for this restaurant
        const existingCategory = await MenuCategory.findOne({
            where: {
                restaurantId,
                name,
            },
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category name already exists for this restaurant",
            });
        }

        // Create category
        const category = await MenuCategory.create({
            restaurantId,
            name,
            description: description || null,
            displayOrder: displayOrder !== undefined ? displayOrder : 0,
            status: status || "active",
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({
            success: false,
            message: "Error creating category",
            error: error.message,
        });
    }
};

/**
 * Get all categories with filtering and sorting
 * GET /api/admin/menu/categories
 */
exports.getCategories = async (req, res) => {
    try {
        const { status, sortBy = "displayOrder", order = "ASC" } = req.query;

        // Enforce authenticated tenant scope
        const restaurantId = req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";


        // Build where clause
        const where = { restaurantId };
        if (status) {
            where.status = status;
        }

        // Build order clause
        let orderClause;
        switch (sortBy) {
            case "name":
                orderClause = [["name", order.toUpperCase()]];
                break;
            case "createdAt":
                orderClause = [["created_at", order.toUpperCase()]];
                break;
            case "displayOrder":
            default:
                orderClause = [["display_order", order.toUpperCase()]];
                break;
        }

        const categories = await MenuCategory.findAll({
            where,
            order: orderClause,
            attributes: {
                include: [
                    // TODO: Add count of items when MenuItem model is created
                    // [sequelize.literal('(SELECT COUNT(*) FROM menu_items WHERE menu_items.category_id = MenuCategory.id)'), 'itemCount']
                ],
            },
        });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message,
        });
    }
};

/**
 * Get a single category by ID
 * GET /api/admin/menu/categories/:id
 */
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        // Enforce authenticated tenant scope
        const restaurantId = req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";


        const category = await MenuCategory.findOne({
            where: {
                id,
                restaurantId,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching category",
            error: error.message,
        });
    }
};

/**
 * Update a category
 * PUT /api/admin/menu/categories/:id
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, displayOrder, status } = req.body;
        // Enforce authenticated tenant scope
        const restaurantId = req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";


        // Find category
        const category = await MenuCategory.findOne({
            where: {
                id,
                restaurantId,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Validate name if provided
        if (name !== undefined) {
            if (!name || name.length < 2 || name.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Name must be between 2 and 50 characters",
                });
            }

            // Check if name already exists (excluding current category)
            const existingCategory = await MenuCategory.findOne({
                where: {
                    restaurantId,
                    name,
                    id: { [Op.ne]: id },
                },
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category name already exists for this restaurant",
                });
            }
        }

        // Validate displayOrder if provided
        if (displayOrder !== undefined && displayOrder < 0) {
            return res.status(400).json({
                success: false,
                message: "Display order must be a non-negative integer",
            });
        }

        // Update category
        if (name !== undefined) category.name = name;
        if (description !== undefined) category.description = description;
        if (displayOrder !== undefined) category.displayOrder = displayOrder;
        if (status !== undefined) category.status = status;

        await category.save();

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            success: false,
            message: "Error updating category",
            error: error.message,
        });
    }
};

/**
 * Update category status
 * PATCH /api/admin/menu/categories/:id/status
 */
exports.updateCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Enforce authenticated tenant scope
        const restaurantId = req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";


        if (!status || !["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required (active or inactive)",
            });
        }

        const category = await MenuCategory.findOne({
            where: {
                id,
                restaurantId,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        category.status = status;
        await category.save();

        res.status(200).json({
            success: true,
            message: `Category ${status === "active" ? "activated" : "deactivated"} successfully`,
            data: category,
        });
    } catch (error) {
        console.error("Error updating category status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating category status",
            error: error.message,
        });
    }
};

/**
 * Soft delete a category
 * DELETE /api/admin/menu/categories/:id
 */
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Enforce authenticated tenant scope
        const restaurantId = req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";


        const category = await MenuCategory.findOne({
            where: {
                id,
                restaurantId,
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // TODO: Check if category has active items when MenuItem model is created
        // const activeItemCount = await MenuItem.count({
        //     where: {
        //         categoryId: id,
        //         status: 'available',
        //         isDeleted: false
        //     }
        // });
        //
        // if (activeItemCount > 0) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Cannot delete category with active items'
        //     });
        // }

        // Soft delete by setting status to inactive
        category.status = "inactive";
        await category.save();

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting category",
            error: error.message,
        });
    }
};
