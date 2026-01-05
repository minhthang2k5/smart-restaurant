require("dotenv").config({ path: "./config.env" });
const { configureCloudinary } = require("./config/cloudinary");
const app = require("./app");
const sequelize = require("./config/database");

// Configure Cloudinary
configureCloudinary();

// Load models and set up associations
require("./models/associations");

const PORT = process.env.PORT || 3000;

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully");

        // Sync models (create tables if not exists)
        // Note: Use migrations for schema changes to avoid sync issues
        await sequelize.sync({ alter: false }); // Don't alter existing tables
        console.log("✅ Database models synced");

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Unable to start server:", error);
        process.exit(1);
    }
};

startServer();
