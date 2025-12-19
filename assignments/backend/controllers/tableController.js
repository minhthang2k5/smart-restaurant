const Table = require("../models/Table");
const { Op } = require("sequelize");

/**
 * Get all tables with optional filters and sorting
 * Query params:
 * - status: filter by status (active/inactive)
 * - location: filter by location
 * - sortBy: field to sort by (tableNumber, capacity, createdAt)
 * - order: sort order (ASC/DESC)
 */
exports.getAllTables = async (req, res) => {
    try {
        const { status, location, sortBy = "createdAt", order = "ASC" } = req.query;

        // Build filter object
        const where = {};
        if (status) {
            where.status = status;
        }
        if (location) {
            where.location = location;
        }

        // Map sortBy to actual field names
        const sortField = sortBy === "tableNumber" ? "table_number" : sortBy;

        const tables = await Table.findAll({
            where,
            order: [[sortField, order.toUpperCase()]],
        });

        res.json({
            success: true,
            data: tables,
            count: tables.length,
        });
    } catch (error) {
        console.error("Error fetching tables:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching tables",
            error: error.message,
        });
    }
};

/**
 * Get single table by ID
 */
exports.getTableById = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findByPk(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        res.json({
            success: true,
            data: table,
        });
    } catch (error) {
        console.error("Error fetching table:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching table",
            error: error.message,
        });
    }
};

/**
 * Create new table
 */
exports.createTable = async (req, res) => {
    try {
        const { tableNumber, capacity, location, description } = req.body;

        // Validation
        if (!tableNumber || !capacity || !location) {
            return res.status(400).json({
                success: false,
                message: "Table number, capacity, and location are required",
            });
        }

        // Check capacity range
        if (capacity < 1 || capacity > 20) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be between 1 and 20",
            });
        }

        // Check if table number already exists
        const existingTable = await Table.findOne({
            where: { tableNumber },
        });

        if (existingTable) {
            return res.status(409).json({
                success: false,
                message: "Table number already exists",
            });
        }

        // Create table
        const table = await Table.create({
            tableNumber,
            capacity,
            location,
            description,
            status: "active",
        });

        res.status(201).json({
            success: true,
            message: "Table created successfully",
            data: table,
        });
    } catch (error) {
        console.error("Error creating table:", error);
        res.status(500).json({
            success: false,
            message: "Error creating table",
            error: error.message,
        });
    }
};

/**
 * Update table details
 */
exports.updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const { tableNumber, capacity, location, description } = req.body;

        const table = await Table.findByPk(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        // Validation
        if (capacity && (capacity < 1 || capacity > 20)) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be between 1 and 20",
            });
        }

        // Check if new table number already exists (if changed)
        if (tableNumber && tableNumber !== table.tableNumber) {
            const existingTable = await Table.findOne({
                where: {
                    tableNumber,
                    id: { [Op.ne]: id },
                },
            });

            if (existingTable) {
                return res.status(409).json({
                    success: false,
                    message: "Table number already exists",
                });
            }
        }

        // Update table
        await table.update({
            tableNumber: tableNumber || table.tableNumber,
            capacity: capacity || table.capacity,
            location: location || table.location,
            description: description !== undefined ? description : table.description,
        });

        res.json({
            success: true,
            message: "Table updated successfully",
            data: table,
        });
    } catch (error) {
        console.error("Error updating table:", error);
        res.status(500).json({
            success: false,
            message: "Error updating table",
            error: error.message,
        });
    }
};

/**
 * Update table status (activate/deactivate)
 */
exports.updateTableStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !["active", "inactive"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status (active/inactive) is required",
            });
        }

        const table = await Table.findByPk(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        // TODO: Check if table has active orders before deactivating
        // This would require access to Orders model
        // if (status === 'inactive') {
        //     const activeOrders = await Order.count({
        //         where: {
        //             tableId: id,
        //             status: ['pending', 'preparing', 'ready']
        //         }
        //     });
        //     if (activeOrders > 0) {
        //         return res.status(400).json({
        //             success: false,
        //             message: 'Cannot deactivate table with active orders',
        //             activeOrders
        //         });
        //     }
        // }

        await table.update({ status });

        res.json({
            success: true,
            message: `Table ${status === "active" ? "activated" : "deactivated"} successfully`,
            data: table,
        });
    } catch (error) {
        console.error("Error updating table status:", error);
        res.status(500).json({
            success: false,
            message: "Error updating table status",
            error: error.message,
        });
    }
};

/**
 * Delete table (soft delete by deactivating)
 */
exports.deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        const table = await Table.findByPk(id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: "Table not found",
            });
        }

        // Soft delete by setting status to inactive
        await table.update({ status: "inactive" });

        res.json({
            success: true,
            message: "Table deactivated successfully",
        });
    } catch (error) {
        console.error("Error deleting table:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting table",
            error: error.message,
        });
    }
};
