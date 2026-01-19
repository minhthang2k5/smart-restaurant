const express = require("express");
const router = express.Router();
const menuItemController = require("../controllers/menuItemController");
const photoController = require("../controllers/photoController");
const menuItemModifierController = require("../controllers/menuItemModifierController");
const { photosUpload, MAX_FILE_SIZE_MB } = require("../services/uploadService");
const { authenticate, authorize } = require("../middleware/auth");

// Apply authentication and authorization to all routes (Admin only)
router.use(authenticate);
router.use(authorize(["admin"]));

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
    (req, res, next) => {
        photosUpload.array("photos", 5)(req, res, (err) => {
            if (err) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        status: "fail",
                        message: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
                    });
                }
                if (err.message) {
                    return res.status(400).json({
                        status: "fail",
                        message: err.message,
                    });
                }
                return res.status(500).json({
                    status: "error",
                    message: "Upload failed",
                });
            }
            next();
        });
    },
    photoController.uploadPhotos
);

router.delete("/:id/photos/:photoId", photoController.deletePhoto);

router.patch("/:id/photos/:photoId/primary", photoController.setPrimaryPhoto);

// Modifier Groups: attach/detach groups to items
router.post("/:id/modifier-groups", menuItemModifierController.attachModifierGroups);
router.get("/:id/modifier-groups", menuItemModifierController.getMenuItemModifierGroups);
router.delete("/:id/modifier-groups", menuItemModifierController.detachAllModifierGroups);

module.exports = router;
