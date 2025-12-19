require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const tableRoutes = require("./routes/tableRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/admin/tables", tableRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Smart Restaurant API is running" });
});

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully");

        // Sync models (create tables if not exists)
        await sequelize.sync({ alter: false }); // Set to true in development to auto-update schema
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

module.exports = app;
