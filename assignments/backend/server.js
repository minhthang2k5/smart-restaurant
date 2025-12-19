require("dotenv").config({ path: "./config.env" });
const sequelize = require("./config/database");
const app = require("./app");

const port = process.env.PORT || 3000;

sequelize
    .authenticate()
    .then(() => {
        console.log("DB connection successful!");
        return sequelize.sync({ alter: true });
    })
    .then(() => {
        app.listen(port, () => {
            console.log(`App is listening on port ${port}...`);
        });
    })
    .catch((err) => console.error("Unable to connect to the database:", err));
