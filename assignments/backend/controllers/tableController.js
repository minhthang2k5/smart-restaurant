const qrService = require("./../services/qrService");
const Table = require("./../models/Table");
const downloadService = require("./../services/downloadService");
const archiver = require("archiver");

/**
 * Generate and save QR code for a table
 */
exports.generateTableQRCode = async (req, res) => {
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
        });
    }
};
