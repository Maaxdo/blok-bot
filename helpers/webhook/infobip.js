const axios = require("axios");

const InfoBipAxios = axios.create({
  baseURL: process.env.INFOBIP_BASE_API_URL || "https://e54l51.api.infobip.com",
  method: "POST",
  headers: {
    Authorization: `App ${process.env.INFOBIP_API_KEY}`,
  },
});

module.exports = {
  InfoBipAxios,
};
