const axios = require("axios");

const BlokAxios = axios.create({
  baseURL: "https://ideological-ernesta-primidac-eb5354e7.koyeb.app",
});

module.exports = {
  BlokAxios,
};
