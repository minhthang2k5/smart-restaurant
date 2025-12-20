const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        dialect: "postgres",
        logging: process.env.NODE_ENV !== "production", // No logs in production
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },

        // Add SSL support for production
        dialectOptions:
            process.env.NODE_ENV === "production"
                ? {
                      ssl: {
                          require: true,
                          rejectUnauthorized: false, // For self-signed certificates
                      },
                  }
                : {},
    }
);

module.exports = sequelize;
