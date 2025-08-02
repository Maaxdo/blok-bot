const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  development: {
    username: process.env.DB_DEV_USER,
    password: process.env.DB_DEV_PASSWORD,
    database: process.env.DB_DEV_NAME,
    host: process.env.DB_DEV_HOST,
    port: parseInt(process.env.DB_DEV_PORT),
    dialect: "mysql",
    logging: false,
  },
  test: {
    username: process.env.DB_TEST_USER,
    password: process.env.DB_TEST_PASSWORD,
    database: process.env.DB_TEST_NAME,
    host: process.env.DB_TEST_HOST,
    port: parseInt(process.env.DB_TEST_PORT),
    dialect: "mysql",
  },
  production: {
    username: process.env.DB_PROD_USER,
    password: process.env.DB_PROD_PASSWORD,
    database: process.env.DB_PROD_NAME,
    host: process.env.DB_PROD_HOST,
    port: parseInt(process.env.DB_PROD_PORT),
    dialect: "postgres",
  },
};
