const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const tableRouter = require("./routes/tableRoutes");
const menuRouter = require("./routes/menuRoutes");
const menuItemRouter = require("./routes/menuItemRoutes");
const menuCategoryRouter = require("./routes/menuCategoryRoutes");
const modifierGroupRouter = require("./routes/modifierGroupRoutes");
const modifierOptionRouter = require("./routes/modifierOptionRoutes");

const app = express();

// CORS Configuration for production
const corsOptions = {
    origin:
        process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL // Only allow your frontend domain
            : "*", // Allow all in development
    credentials: true,
    optionsSuccessStatus: 200,
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Add security headers
app.use(helmet());

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use((req, res, next) => {
    console.log("Hello from middleware 👋");
    next();
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/admin/tables", tableRouter); // admin-facing routes
app.use("/api/menu", menuRouter); // Public/customer-facing routes
app.use("/api/admin/menu/items", menuItemRouter); // admin-facing menu item routes
app.use("/api/admin/menu/categories", menuCategoryRouter); // admin-facing menu category routes
app.use("/api/admin/menu/modifier-groups", modifierGroupRouter); // admin-facing modifier group routes
app.use("/api/admin/menu/modifier-options", modifierOptionRouter); // admin-facing modifier option routes

module.exports = app;
