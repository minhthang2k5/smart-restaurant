const Table = require("../models/Table");
const { Op } = require("sequelize");
const qrService = require("../services/qrService");
const downloadService = require("../services/downloadService");
const archiver = require("archiver");

// ==================== CRUD OPERATIONS ====================

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

// ==================== QR CODE OPERATIONS ====================
    try {
        const { id } = req.params;

        const table = await Table.findByPk(id);

        if (!table) {
            return res.status(404).json({
                status: "fail",
                message: "No table found with that ID",
            });
        }

        // 1. Call the service to generate and save the token
        const token = await qrService.getOrGenerateToken(table);

        const qrCodeImage = await qrService.generateQrCodeImage(
            token,
            table.id
        );

        res.status(200).json({
            status: "success",
            message: "QR code generated successfully",
            data: {
                tableId: table.id,
                tableNumber: table.tableNumber,
                token,
                qrCodeImage, // a base64 image string
                createdAt: table.qrTokenCreatedAt,
            },
        });
    } catch (err) {
        res.status(500).json({
            status: "fail",
            message: "An error occurred while generating the QR code.",
            error: err.message,
        });
    }
};

/**
 * Download single table QR code as PNG or PDF
 */
exports.downloadTableQR = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = "png", includeWifi = "false" } = req.query;

        // Validate table exists
        const table = await Table.findByPk(id);
        if (!table) {
            return res.status(404).json({
                status: "fail",
                message: "No table found with that ID",
            });
        }

        // Get or generate token
        const token = await qrService.getOrGenerateToken(table);

        if (format === "png") {
            // Generate high-res PNG
            const pngBuffer = await downloadService.generateHighResPNG(
                token,
                table.id
            );

            res.set({
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="table-${table.tableNumber}-qr.png"`,
            });

            return res.send(pngBuffer);
        } else if (format === "pdf") {
            // Generate PDF
            const pdfDoc = await downloadService.generateQRPDF(token, table, {
                includeWifi: includeWifi === "true",
                wifiSSID: process.env.WIFI_SSID,
                wifiPassword: process.env.WIFI_PASSWORD,
            });

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="table-${table.tableNumber}-qr.pdf"`,
            });

            pdfDoc.pipe(res);
            pdfDoc.end();
        } else {
            return res.status(400).json({
                status: "fail",
                message: "Invalid format. Use 'png' or 'pdf'.",
            });
        }
    } catch (err) {
        console.error("Error in downloadTableQR:", err);
        res.status(500).json({
            status: "error",
            message: "An error occurred while generating the download.",
            error: err.message,
        });
    }
};

/**
 * Download all QR codes as ZIP or bulk PDF
 */
exports.downloadAllQR = async (req, res) => {
    try {
        const { format = "zip" } = req.query;

        // Get all active tables
        const tables = await Table.findAll({
            where: { status: "active" },
            order: [["tableNumber", "ASC"]],
        });

        if (tables.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "No active tables found",
            });
        }

        if (format === "zip") {
            // Create ZIP archive
            const archive = archiver("zip", { zlib: { level: 9 } });

            res.set({
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="all-table-qr-codes.zip"`,
            });

            archive.pipe(res);

            // Generate PNG for each table and add to ZIP
            for (const table of tables) {
                const token = await qrService.getOrGenerateToken(table);
                const pngBuffer = await downloadService.generateHighResPNG(
                    token,
                    table.id
                );

                archive.append(pngBuffer, {
                    name: `table-${table.tableNumber}-qr.png`,
                });
            }

            await archive.finalize();
        } else if (format === "pdf") {
            // Generate bulk PDF
            const tablesWithTokens = await Promise.all(
                tables.map(async (table) => ({
                    table,
                    token: await qrService.getOrGenerateToken(table),
                }))
            );

            const pdfDoc = await downloadService.generateBulkPDF(
                tablesWithTokens
            );

            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="all-tables-qr.pdf"`,
            });

            pdfDoc.pipe(res);
            pdfDoc.end();
        } else {
            return res.status(400).json({
                status: "fail",
                message: "Invalid format. Use 'zip' or 'pdf'.",
            });
        }
    } catch (err) {
        console.error("Error in downloadAllQR:", err);
        res.status(500).json({
            status: "error",
            message: "An error occurred while generating the download.",
            error: err.message,
>>>>>>> 72991a5f649a7e4339f2546a83fe91b340386845
        });
    }
};
