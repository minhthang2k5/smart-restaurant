const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Table = require("./../models/Table");

/**
 * Signs a JWT with a given payload.
 * This function centralizes the token signing logic, using secrets
 * and expiration settings from the environment variables.
 * @param {object} payload - The data to include in the token's payload.
 * @returns {string} The signed JSON Web Token.
 */
const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

/**
 * Generates a new JWT for a table, saves its creation date to the DB,
 * and returns the token.
 * @param {object} table - The Sequelize table instance.
 * @returns {Promise<string>} The generated JWT.
 */
const generateQrToken = async (table) => {
    const issuedAtDate = new Date();
    const issuedAtTimestamp = Math.floor(issuedAtDate.getTime() / 1000);

    // 1. Create the JWT payload
    const payload = {
        tableId: table.id,
        restaurantId: "restaurant_123", // The static value for now
        timestamp: issuedAtTimestamp,
        // We include 'iat' manually to sync it with the DB value
        iat: issuedAtTimestamp,
    };

    // 2. Sign the token
    const token = signToken(payload);

    // 3. Update the table with the new token and its creation timestamp
    // This invalidates any previously issued tokens.
    await table.update({
        qrToken: token,
        qrTokenCreatedAt: issuedAtDate,
    });

    return token;
};

/**
 * Generates a QR code image from a token by embedding it in a URL.
 * @param {string} token - The JWT to encode.
 * @returns {Promise<string>} A Data URL string of the QR code image (e.g., "data:image/png;base64,...").
 */
const generateQrCodeImage = async (token, tableId) => {
    // This URL will be what the user's phone opens.
    // The frontend will be responsible for handling the /menu route.

    const frontendUrl = `${process.env.FRONTEND_URL}/menu?table=${tableId}&token=${token}`;
    try {
        const qrCodeDataURL = await QRCode.toDataURL(frontendUrl);
        return qrCodeDataURL;
    } catch (err) {
        console.error("Failed to generate QR code image", err);
        throw new Error("Could not generate QR code image.");
    }
};

/**
 * Verifies a QR token and returns the associated table if valid.
 * @param {string} token - The JWT from the QR code.
 * @returns {Promise<object>} The Sequelize table instance.
 * @throws {Error} If the token is invalid, expired, or has been replaced.
 */
const verifyQrToken = async (token) => {
    // 1. Stateless verification (signature, expiration)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Find the table from the token's payload.
    const table = await Table.findByPk(decoded.tableId);
    if (!table) {
        throw new Error("Table not found.");
    }

    // Verify restaurant ID for future multi-restaurant support

    // 3. Stateful verification (is this the latest token?)
    // Compare the token's 'issued at' time with the timestamp in the database.
    // We convert the DB timestamp to seconds to match the JWT 'iat' format.
    const dbTokenTimestamp = Math.floor(
        table.qrTokenCreatedAt.getTime() / 1000
    );

    if (decoded.iat !== dbTokenTimestamp) {
        // This is an old token because a newer one has been generated.
        throw new Error(
            "This QR code is no longer valid. Please ask staff for assistance."
        );
    }

    return table;
};

/**
 * Gets the current token for a table, or generates a new one if it doesn't exist
 * @param {object} table - The Sequelize table instance
 * @returns {Promise<string>} The JWT token
 */
const getOrGenerateToken = async (table) => {
    // If table already has a valid token, return it
    if (table.qrToken && table.qrTokenCreatedAt) return table.qrToken;

    // Else, generate a new one
    return await generateQrToken(table);
};

module.exports = {
    generateQrToken,
    generateQrCodeImage,
    verifyQrToken,
    getOrGenerateToken,
};
