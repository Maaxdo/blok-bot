const { sendText } = require("../../../helpers/bot/infobip");

async function handleSupport(user, message) {
  await sendText({
    user,
    text: "Sorry, the command you provided is not supported yet ❌.\n\nNeed Assistance? Message our whatsapp support channel for more information\nhttps://wa.me/2347025673522",
  });
}

module.exports = {
  handleSupport,
};
