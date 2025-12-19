const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");

// CRUD Operations
// Get all tables with filters
router.get("/", tableController.getAllTables);

// Get single table by ID
router.get("/:id", tableController.getTableById);

// Create new table
router.post("/", tableController.createTable);

// Update table details
router.put("/:id", tableController.updateTable);

// Update table status (activate/deactivate)
router.patch("/:id/status", tableController.updateTableStatus);

// Delete table (soft delete)
router.delete("/:id", tableController.deleteTable);

// QR Code Operations
// Generate QR code
router.post("/:id/qr/generate", tableController.generateTableQRCode);

// Download single table QR code
router.get("/:id/qr/download", tableController.downloadTableQR);

// Download all QR codes
router.get("/qr/download-all", tableController.downloadAllQR);

module.exports = router;
