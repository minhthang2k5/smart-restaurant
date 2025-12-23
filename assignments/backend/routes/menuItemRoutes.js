const express = require("express");
const router = express.Router();
const menuItemController = require("../controllers/menuItemController");
const photoController = require("../controllers/photoController");
const { photosUpload } = require("../services/uploadService");

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

// Photos: upload multiple, delete one, set primary
router.post(
    "/:id/photos",
    photosUpload.array("photos", 5),
    photoController.uploadPhotos
);

router.delete("/:id/photos/:photoId", photoController.deletePhoto);

router.patch("/:id/photos/:photoId/primary", photoController.setPrimaryPhoto);

module.exports = router;
