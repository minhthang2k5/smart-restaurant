const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");
const streamifier = require("streamifier");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Generate a safe, randomized filename keeping original extension.
 * @param {string} originalName
 * @returns {string}
 */
function getSafeFilename(originalName) {
    const ext = originalName.split(".").pop().toLowerCase();
    const name = uuidv4();
    return `${name}.${ext}`;
}

/**
 * Build Cloudinary folder path for menu item photos.
 * @param {string} itemId
 * @returns {string} folder path
 */
function getCloudinaryFolder(itemId) {
    return `smart-restaurant/menu-items/${itemId}`;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} publicId
 * @returns {Promise<object>} Cloudinary upload result
 */
function uploadToCloudinary(fileBuffer, folder, publicId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: publicId,
                resource_type: "image",
                transformation: [
                    { width: 1200, height: 1200, crop: "limit" },
                    { quality: "auto" },
                    { fetch_format: "auto" },
                ],
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}

/**
 * Multer storage engine using memory storage for Cloudinary uploads.
 */
const storage = multer.memoryStorage();

/**
 * Multer file filter to validate MIME type.
 * @param {Express.Request} req
 * @param {Express.Multer.File} file
 * @param {(error: Error|null, acceptFile?: boolean) => void} cb
 */
function fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error("Invalid file type. Allowed: JPG, PNG, WebP"));
    }
    cb(null, true);
}

/**
 * Middleware to handle photo uploads for menu items.
 * Accepts multiple files via field name 'photos'.
 */
const photosUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * Process and upload files to Cloudinary.
 * @param {Express.Multer.File[]} files
 * @param {string} itemId
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
async function uploadPhotosToCloudinary(files, itemId) {
    const folder = getCloudinaryFolder(itemId);
    const uploadPromises = files.map((file) => {
        const publicId = getSafeFilename(file.originalname).split(".")[0];
        return uploadToCloudinary(file.buffer, folder, publicId);
    });

    const results = await Promise.all(uploadPromises);
    return results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
    }));
}

/**
 * Delete a photo from Cloudinary.
 * @param {string} publicId
 * @returns {Promise<object>}
 */
async function deletePhotoFromCloudinary(publicId) {
    return cloudinary.uploader.destroy(publicId);
}

module.exports = {
    photosUpload,
    uploadPhotosToCloudinary,
    deletePhotoFromCloudinary,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_MB,
    cloudinary,
    getCloudinaryFolder,
    getSafeFilename,
};
