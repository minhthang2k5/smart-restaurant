require("dotenv").config({ path: "./config.env" });
const app = require("./app");
const sequelize = require("./config/database");

const PORT = process.env.PORT || 3000;

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully");

        // Sync models (create tables if not exists)
        await sequelize.sync({ alter: true }); // Set to true in development to auto-update schema
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
