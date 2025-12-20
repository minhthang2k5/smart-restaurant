const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const tableRouter = require("./routes/tableRoutes");
const menuRouter = require("./routes/menuRoutes");

const app = express();

// Enable CORS for all routes
app.use(cors());

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

app.get("/", (req, res) => {
    res.send("This is the smart restaurant API");
});

module.exports = app;
