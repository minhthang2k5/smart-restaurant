const MenuItem = require("../models/MenuItem");
const APIFeatures = require("../utils/apiFeatures");

// GET /api/admin/menu/items
// Get all menu items with filtering, sorting, and pagination
// Query params: ?page=1&limit=10&sort=price&order=ASC&name=chicken&category_id=1&status=available
exports.getAllItems = async (req, res) => {
    try {
        // Base filter: soft delete only (single tenant)
        const baseWhere = {
            is_deleted: false,
        };

        // Build query using APIFeatures
        const features = new APIFeatures(MenuItem, req.query);
        features
            .filter(baseWhere)
            .search() // Search by name
            .filterByCategory() // Filter by category_id
            .filterByStatus() // Filter by status
            .sort() // Sort (default: created_at DESC)
            .paginate(); // Paginate (default: page=1, limit=10)

        // Get total count for pagination
        const totalCount = await features.getCount();

        // Execute query
        const items = await features.execute();

        res.status(200).json({
            status: "success",
            results: items.length,
            pagination: features.getPaginationData(totalCount),
            data: items,
        });
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch menu items",
            error: error.message,
        });
    }
};

// GET /api/admin/menu/items/:id
// Get single menu item by ID
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await MenuItem.findOne({
            where: {
                id,
                is_deleted: false,
            },
        });

        if (!item) {
            return res.status(404).json({
                status: "fail",
                message: "Menu item not found",
            });
        }

        res.status(200).json({
            status: "success",
            data: item,
        });
    } catch (error) {
        console.error("Error fetching menu item:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch menu item",
            error: error.message,
        });
    }
};

// POST /api/admin/menu/items
// Create new menu item
exports.createItem = async (req, res) => {
    try {
        const {
            category_id,
            name,
            description,
            price,
            prep_time_minutes,
            status,
            is_chef_recommended,
        } = req.body;

        // Validate required fields
        if (!category_id || !name || price === undefined) {
            return res.status(400).json({
                status: "fail",
                message: "Please provide category_id, name, and price",
            });
        }

        // Create menu item
        const newItem = await MenuItem.create({
            category_id,
            name,
            description,
            price,
            prep_time_minutes: prep_time_minutes || 0,
            status: status || "available",
            is_chef_recommended: is_chef_recommended || false,
        });

        res.status(201).json({
            status: "success",
            message: "Menu item created successfully",
            data: newItem,
        });
    } catch (error) {
        console.error("Error creating menu item:", error);

        // Handle Sequelize validation errors
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((err) => err.message);
            return res.status(400).json({
                status: "fail",
                message: "Validation error",
                errors: messages,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to create menu item",
            error: error.message,
        });
    }
};

// PUT /api/admin/menu/items/:id
// Update menu item
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Remove fields that shouldn't be updated
        const updateData = { ...req.body };
        delete updateData.id;
        delete updateData.restaurant_id;
        delete updateData.created_at;
        delete updateData.is_deleted;

        // Find and update
        const [updatedCount, [updatedItem]] = await MenuItem.update(
            updateData,
            {
                where: {
                    id,
                    is_deleted: false,
                },
                returning: true, // Return updated record
                individualHooks: true, // Trigger Sequelize validations
            }
        );

        if (updatedCount === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Menu item not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Menu item updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        console.error("Error updating menu item:", error);

        // Handle Sequelize validation errors
        if (error.name === "SequelizeValidationError") {
            const messages = error.errors.map((err) => err.message);
            return res.status(400).json({
                status: "fail",
                message: "Validation error",
                errors: messages,
            });
        }

        res.status(500).json({
            status: "error",
            message: "Failed to update menu item",
            error: error.message,
        });
    }
};

// DELETE /api/admin/menu/items/:id
// Soft delete menu item (set is_deleted = true)
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete: update is_deleted flag
        const [updatedCount] = await MenuItem.update(
            { is_deleted: true },
            {
                where: {
                    id,
                    is_deleted: false,
                },
            }
        );

        if (updatedCount === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Menu item not found",
            });
        }

        res.status(204).json({
            status: "success",
            data: null,
        });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to delete menu item",
            error: error.message,
        });
    }
};
