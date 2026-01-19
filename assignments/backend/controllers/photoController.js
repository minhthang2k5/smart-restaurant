const { Sequelize } = require("sequelize");
const MenuItem = require("../models/MenuItem");
const MenuItemPhoto = require("../models/MenuItemPhoto");
const { uploadPhotosToCloudinary, deletePhotoFromCloudinary } = require("../services/uploadService");

/**
 * Create photo records for uploaded files.
 * Sets the first photo as primary if the item has no primary yet.
 *
 * @param {Request} req - Express request with params.id and files
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
exports.uploadPhotos = async (req, res) => {
    try {
        const itemId = req.params.id;

        // Validate item exists and not deleted
        const item = await MenuItem.findOne({
            where: { id: itemId, is_deleted: false },
        });
        if (!item) {
            return res
                .status(404)
                .json({ status: "fail", message: "Menu item not found" });
        }

        const files = req.files || [];
        if (files.length === 0) {
            return res
                .status(400)
                .json({ status: "fail", message: "No files uploaded" });
        }

        // Upload files to Cloudinary
        const uploadResults = await uploadPhotosToCloudinary(files, itemId);

        // Check if item already has a primary photo
        const existingPrimary = await MenuItemPhoto.findOne({
            where: { menu_item_id: itemId, is_primary: true },
        });

        const created = [];
        for (let i = 0; i < uploadResults.length; i++) {
            const result = uploadResults[i];
            const photo = await MenuItemPhoto.create({
                menu_item_id: itemId,
                url: result.url,
                cloudinary_public_id: result.publicId,
                is_primary: !existingPrimary && i === 0, // set first as primary if none exists
            });
            created.push(photo);
        }

        return res.status(201).json({
            status: "success",
            message: "Photos uploaded successfully",
            data: created,
        });
    } catch (err) {
        console.error("uploadPhotos error:", err);
        return res
            .status(500)
            .json({ status: "error", message: err.message || "Failed to upload photos" });
    }
};

/**
 * Delete a photo record and remove the file from storage.
 * Ensures the photo belongs to the given item.
 * If the deleted photo was primary, no automatic reassignment is performed.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
exports.deletePhoto = async (req, res) => {
    try {
        const itemId = req.params.id;
        const photoId = req.params.photoId;

        const photo = await MenuItemPhoto.findOne({
            where: { id: photoId, menu_item_id: itemId },
        });

        if (!photo) {
            return res
                .status(404)
                .json({ status: "fail", message: "Photo not found" });
        }

        // check for deleting primary photo
        const wasPrimary = photo.is_primary;

        // Delete from Cloudinary if public_id exists
        if (photo.cloudinary_public_id) {
            try {
                await deletePhotoFromCloudinary(photo.cloudinary_public_id);
            } catch (e) {
                console.warn("Failed to remove photo from Cloudinary:", e.message);
            }
        }

        await MenuItemPhoto.destroy({ where: { id: photoId } });

        // set the oldest photo as primary if the deleted one was primary
        if (wasPrimary) {
            // Promote the oldest remaining photo to primary, if any
            const replacement = await MenuItemPhoto.findOne({
                where: { menu_item_id: itemId },
                order: [["created_at", "ASC"]],
            });

            if (replacement) {
                replacement.is_primary = true;
                await replacement.save();
            }
        }

        return res.status(204).json({ status: "success", data: null });
    } catch (err) {
        console.error("deletePhoto error:", err);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to delete photo" });
    }
};

/**
 * Set a photo as primary for a menu item.
 * Clears any existing primary flags on other photos of the same item.
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
exports.setPrimaryPhoto = async (req, res) => {
    const t = await MenuItemPhoto.sequelize.transaction();
    try {
        const itemId = req.params.id;
        const photoId = req.params.photoId;

        const photo = await MenuItemPhoto.findOne({
            where: { id: photoId, menu_item_id: itemId },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        if (!photo) {
            await t.rollback();
            return res
                .status(404)
                .json({ status: "fail", message: "Photo not found" });
        }

        // Clear existing primary flags
        await MenuItemPhoto.update(
            { is_primary: false },
            { where: { menu_item_id: itemId }, transaction: t }
        );

        // Set selected photo as primary
        photo.is_primary = true;
        await photo.save({ transaction: t });

        await t.commit();

        return res.status(200).json({
            status: "success",
            message: "Primary photo set",
            data: photo,
        });
    } catch (err) {
        await t.rollback();
        console.error("setPrimaryPhoto error:", err);
        return res
            .status(500)
            .json({ status: "error", message: "Failed to set primary photo" });
    }
};
