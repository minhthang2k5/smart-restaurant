const express = require("express");
const router = express.Router();
const tableController = require("../controllers/tableController");

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

module.exports = router;
