const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const tableRouter = require("./routes/tableRoutes");
const menuRouter = require("./routes/menuRoutes");

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

app.use("/api/admin/tables", tableRouter); // admin-facing routes
app.use("/api/menu", menuRouter); // Public/customer-facing routes

module.exports = app;
