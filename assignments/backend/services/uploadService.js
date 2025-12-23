const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Ensure a directory exists, creating it recursively if missing.
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Build safe destination directory for menu item photos.
 * @param {string} itemId
 * @returns {string} absolute path
 */
function getItemUploadDir(itemId) {
    return path.join(__dirname, "..", "uploads", "menu-items", String(itemId));
}

/**
 * Generate a safe, randomized filename keeping original extension.
 * @param {string} originalName
 * @returns {string}
 */
function getSafeFilename(originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const name = uuidv4();
    return `${name}${ext}`;
}

/**
 * Convert an absolute path to a web URL under /uploads
 * Uses forward slashes for web regardless of OS.
 * @param {string} itemId
 * @param {string} filename
 * @returns {string} web URL
 */
function buildPhotoUrl(itemId, filename) {
    const parts = ["/uploads", "menu-items", String(itemId), filename];
    return parts.join("/");
}

/**
 * Multer storage engine for menu item photo uploads.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const itemId = req.params.id;
        const dir = getItemUploadDir(itemId);
        try {
            ensureDir(dir);
            cb(null, dir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        cb(null, getSafeFilename(file.originalname));
    },
});

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

module.exports = {
    photosUpload,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_MB,
    getItemUploadDir,
    buildPhotoUrl,
};
