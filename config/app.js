require("dotenv").config();

module.exports = {
  apiV1Url: "/",
  infobip: {
    phone: process.env.INFOBIP_PHONE_NUMBER,
  },
};
