const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

/**
 * Helper: Generates QR code buffer from token
 * @param {string} token - The JWT token
 * @param {string} tableId - Table ID for the URL
 * @param {number} width - QR code width in pixels
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateQRCodeBuffer = async (token, tableId, width = 400) => {
    const frontendUrl = `${process.env.FRONTEND_URL}/menu?table=${tableId}&token=${token}`;

    const qrDataURL = await QRCode.toDataURL(frontendUrl, {
        width: width,
        margin: 2,
        errorCorrectionLevel: "H",
    });

    const qrBuffer = Buffer.from(
        qrDataURL.replace(/^data:image\/png;base64,/, ""),
        "base64"
    );

    return qrBuffer;
};

/**
 * Generates a high-resolution PNG QR code
 * @param {string} token - The JWT token
 * @param {string} tableId - Table ID for the URL
 * @returns {Promise<Buffer>} PNG image buffer
 */
const generateHighResPNG = async (token, tableId) => {
    const frontendUrl = `${process.env.FRONTEND_URL}/menu?table=${tableId}&token=${token}`;

    try {
        // Generate QR code as PNG buffer with high quality settings
        const qrBuffer = await QRCode.toBuffer(frontendUrl, {
            type: "png",
            width: 1000, // High resolution
            margin: 4,
            errorCorrectionLevel: "H", // High error correction
            color: {
                dark: "#000000",
                light: "#FFFFFF",
            },
        });

        return qrBuffer;
    } catch (err) {
        console.error("Failed to generate high-res PNG", err);
        throw new Error("Could not generate PNG QR code.");
    }
};

/**
 * Generates a PDF document with QR code
 * @param {string} token - The JWT token
 * @param {object} table - Table object with details
 * @param {object} options - PDF customization options
 * @returns {Promise<PDFDocument>} PDF document stream
 */
const generateQRPDF = async (token, table, options = {}) => {
    const {
        includeWifi = false,
        wifiSSID = "",
        wifiPassword = "",
        restaurantName = process.env.RESTAURANT_NAME || "Smart Restaurant",
    } = options;

    try {
        // Create PDF document
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
        });

        // Generate QR code buffer
        const qrBuffer = await generateQRCodeBuffer(token, table.id, 400);

        // Header - Restaurant Name (if logo path exists, you can add it)
        doc.fontSize(24)
            .font("Helvetica-Bold")
            .text(restaurantName, { align: "center" })
            .moveDown(0.5);

        // Table Number - Prominent display
        doc.fontSize(36)
            .fillColor("#2563eb") // Blue color
            .text(`Table ${table.tableNumber}`, { align: "center" })
            .fillColor("#000000") // Reset to black
            .moveDown(1);

        // QR Code - Centered
        const qrWidth = 300;
        const pageWidth = doc.page.width;
        const qrX = (pageWidth - qrWidth) / 2;

        const imageY = doc.y;

        doc.image(qrBuffer, qrX, imageY, {
            width: qrWidth,
            align: "center",
        });

        // Move cursor below QR code
        doc.y = imageY + qrWidth + 20;

        // Instructions
        doc.fontSize(18)
            .font("Helvetica-Bold")
            .text("Scan to Order", { align: "center" })
            .moveDown(0.5);

        doc.fontSize(12)
            .font("Helvetica")
            .text("1. Open your phone's camera", { align: "center" })
            .text("2. Point it at the QR code above", { align: "center" })
            .text("3. Tap the notification to view our menu", {
                align: "center",
            })
            .moveDown(1);

        // Table Location
        if (table.location) {
            doc.fontSize(10)
                .fillColor("#666666")
                .text(`Location: ${table.location}`, { align: "center" })
                .fillColor("#000000");
        }

        // WiFi Information (Optional)
        if (includeWifi && wifiSSID) {
            doc.moveDown(2);
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .text("Free WiFi", { align: "center" })
                .moveDown(0.3);

            doc.fontSize(11)
                .font("Helvetica")
                .text(`Network: ${wifiSSID}`, { align: "center" });

            if (wifiPassword) {
                doc.text(`Password: ${wifiPassword}`, { align: "center" });
            }
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8)
            .fillColor("#999999")
            .text(`Generated on ${new Date().toLocaleDateString()}`, {
                align: "center",
            });

        return doc;
    } catch (err) {
        console.error("Failed to generate PDF", err);
        throw new Error("Could not generate PDF.");
    }
};

/**
 * Generates a single PDF with multiple tables
 * @param {Array} tables - Array of table objects with tokens
 * @param {object} options - PDF options
 * @returns {Promise<PDFDocument>} PDF document stream
 */
const generateBulkPDF = async (tables, options = {}) => {
    const {
        restaurantName = process.env.RESTAURANT_NAME || "Smart Restaurant",
        layout = "single", // 'single' or 'multiple' per page
    } = options;

    try {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
        });

        for (let i = 0; i < tables.length; i++) {
            const { table, token } = tables[i];

            if (i > 0) {
                doc.addPage(); // New page for each table
            }

            // Generate QR code buffer
            const qrBuffer = await generateQRCodeBuffer(token, table.id, 300);

            // Header
            doc.fontSize(20)
                .font("Helvetica-Bold")
                .text(restaurantName, { align: "center" })
                .moveDown(0.5);

            // Table Number
            doc.fontSize(28)
                .fillColor("#2563eb")
                .text(`Table ${table.tableNumber}`, { align: "center" })
                .fillColor("#000000")
                .moveDown(1);

            // QR Code
            const qrWidth = 250;
            const pageWidth = doc.page.width;
            const qrX = (pageWidth - qrWidth) / 2;
            const imageY = doc.y;

            doc.image(qrBuffer, qrX, imageY, {
                width: qrWidth,
                align: "center",
            });

            // Move cursor below QR code
            doc.y = imageY + qrWidth + 20;

            // Instructions
            doc.fontSize(14)
                .font("Helvetica-Bold")
                .text("Scan to Order", { align: "center" })
                .moveDown(0.3);

            doc.fontSize(10)
                .font("Helvetica")
                .text("Point your camera at the QR code", { align: "center" });

            // Location
            if (table.location) {
                doc.moveDown(1);
                doc.fontSize(9)
                    .fillColor("#666666")
                    .text(`Location: ${table.location}`, { align: "center" })
                    .fillColor("#000000");
            }

            // Footer
            doc.moveDown(1.5);
            doc.fontSize(7)
                .fillColor("#999999")
                .text(
                    `Table ${i + 1} of ${
                        tables.length
                    } | Generated: ${new Date().toLocaleDateString()}`,
                    { align: "center" }
                );
        }

        return doc;
    } catch (err) {
        console.error("Failed to generate bulk PDF", err);
        throw new Error("Could not generate bulk PDF.");
    }
};

module.exports = {
    generateHighResPNG,
    generateQRPDF,
    generateBulkPDF,
};
