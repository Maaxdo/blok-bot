const axios = require("axios");

const baseURL = `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_ID}`;

const WhatsappAxios = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function sendMessage(phone, message) {
  return await WhatsappAxios({
    url: "/messages",
    method: "POST",
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    },
  });
}

async function sendInteractiveMessage(phone, interactive) {
  return await WhatsappAxios({
    url: "/messages",
    method: "POST",
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "interactive",
      interactive,
    },
  });
}

module.exports = {
  sendMessage,
  sendInteractiveMessage,
};
