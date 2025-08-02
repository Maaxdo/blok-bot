const { infobip } = require("../../config/app");
const { InfoBipAxios } = require("../webhook/infobip");

function sendInteractiveButtons({ user, buttons, text = "" }) {
  return InfoBipAxios({
    url: "/whatsapp/1/message/interactive/buttons",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: { text },
        action: {
          buttons,
        },
      },
    },
  });
}

function sendText({ user, text }) {
  return InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text,
      },
    },
  });
}

function sendFlow({ user, action, text }) {
  return InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text,
        },
        action,
      },
    },
  });
}

module.exports = { sendInteractiveButtons, sendText, sendFlow };
