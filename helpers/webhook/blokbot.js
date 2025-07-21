const axios = require("axios");

const BlokAxios = axios.create({
  baseURL:
    process.env.BLOK_BASE_URL ||
    "https://ideological-ernesta-primidac-eb5354e7.koyeb.app",
});

module.exports = {
  BlokAxios,
};
