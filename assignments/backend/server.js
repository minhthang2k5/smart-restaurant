require("dotenv").config({ path: "./config.env" });
const http = require("http");
const { configureCloudinary } = require("./config/cloudinary");
const app = require("./app");
const sequelize = require("./config/database");
const { initSocket, getStats } = require("./socket");

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

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize WebSocket (Socket.IO)
        const io = initSocket(server);
        console.log("✅ WebSocket initialized successfully");

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🔌 WebSocket ready at ws://localhost:${PORT}`);
            console.log(`📊 Available namespaces: /customer, /kitchen, /waiter, /admin`);
            
            // Log connection stats every 30 seconds
            setInterval(() => {
                const stats = getStats();
                if (stats && stats.total > 0) {
                    console.log(`📊 Active connections: ${stats.total} (C:${stats.customers} K:${stats.kitchen} W:${stats.waiters} A:${stats.admin})`);
                }
            }, 30000);
        });
    } catch (error) {
        console.error("❌ Unable to start server:", error);
        process.exit(1);
    }
};

startServer();
