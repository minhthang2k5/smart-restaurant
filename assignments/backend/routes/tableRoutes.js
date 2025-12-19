const express = require("express");
const tableController = require("./../controllers/tableController");
const router = express.Router();

// Generate QR code
router.post("/:id/qr/generate", tableController.generateTableQRCode);

// Download single table QR code
router.get("/:id/qr/download", tableController.downloadTableQR);

// Download all QR codes
router.get("/qr/download-all", tableController.downloadAllQR);

module.exports = router;
