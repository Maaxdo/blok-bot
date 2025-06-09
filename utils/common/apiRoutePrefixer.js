const dotenv = require("dotenv");
dotenv.config();

const apiRoutePrefixer = (route) => {
  return `/${process.env.API_VERSION}/${route}`;
};

module.exports = { apiRoutePrefixer };
