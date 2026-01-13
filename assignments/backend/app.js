const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const passport = require("./config/passport");
const tableRouter = require("./routes/tableRoutes");
const menuRouter = require("./routes/menuRoutes");
const menuItemRouter = require("./routes/menuItemRoutes");
const menuCategoryRouter = require("./routes/menuCategoryRoutes");
const modifierGroupRouter = require("./routes/modifierGroupRoutes");
const modifierOptionRouter = require("./routes/modifierOptionRoutes");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");
const orderRouter = require("./routes/orderRoutes");
const sessionRouter = require("./routes/sessionRoutes");
const cartRouter = require("./routes/cartRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const reportRouter = require("./routes/reportRoutes");

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

// Add security headers (with CORS exceptions)
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use((req, res, next) => {
    console.log("Hello from middleware 👋");
    next();
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Public routes (no authentication required)
app.use("/api/auth", authRouter); // Authentication routes

// User routes (authentication required)
app.use("/api/users", userRouter); // User profile and staff management

// Admin routes (authentication required)
app.use("/api/admin/tables", tableRouter); // admin-facing routes
app.use("/api/menu", menuRouter); // Public/customer-facing routes
app.use("/api/admin/menu/items", menuItemRouter); // admin-facing menu item routes
app.use("/api/admin/menu/categories", menuCategoryRouter); // admin-facing menu category routes
app.use("/api/admin/menu/modifier-groups", modifierGroupRouter); // admin-facing modifier group routes
app.use("/api/admin/menu/modifier-options", modifierOptionRouter); // admin-facing modifier option routes

// Order and Session routes
app.use("/api/orders", orderRouter); // Order status management
app.use("/api/sessions", sessionRouter); // Session-based ordering with payment
app.use("/api/cart", cartRouter); // Cart validation and summary

// Report routes (Admin only) - MUST be before /api/* routes to avoid being caught by reviewRouter
app.use("/api/reports", reportRouter); // Analytics and reports

// Payment routes
app.use("/api", paymentRouter); // Payment processing (MoMo)

// Review routes
app.use("/api", reviewRouter); // Reviews for menu items

module.exports = app;
