const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");
const { authenticate, authorize } = require("../middleware/auth");

// Apply authentication to all routes
router.use(authenticate);
router.use(authorize(["admin", "waiter"]));

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

// Download all QR codes
router.get("/qr/download-all", tableController.downloadAllQR);

// Download single table QR code
router.get("/:id/qr/download", tableController.downloadTableQR);

// Bulk regenerate QR codes
router.post("/qr/regenerate-all", tableController.regenerateAllQR);

module.exports = router;
