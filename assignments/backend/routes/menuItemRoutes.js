const express = require("express");
const router = express.Router();
const menuItemController = require("../controllers/menuItemController");

// Menu Item CRUD routes
router
    .route("/")
    .get(menuItemController.getAllItems) // Get all items
    .post(menuItemController.createItem); // Create item

router
    .route("/:id")
    .get(menuItemController.getItemById) // Get single item
    .put(menuItemController.updateItem) // Update item
    .delete(menuItemController.deleteItem); // Soft delete item

module.exports = router;
