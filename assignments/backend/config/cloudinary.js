const cloudinary = require("cloudinary").v2;

/**
 * Configure Cloudinary with environment variables
 * This should be imported early in server.js after dotenv loads
 */
function configureCloudinary() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
        throw new Error(
            "Missing Cloudinary credentials. Please check your config.env file."
        );
    }
    
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    console.log("✅ Cloudinary configured successfully");
}

module.exports = { configureCloudinary, cloudinary };
