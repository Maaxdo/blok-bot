const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");

async function handleMenu(user) {
  const body =
    "Here's what you can do on Blok:\n\n✅ Buy Crypto - Type /buy\n✅ Sell Crypto - Type /sell\n✅ Deposit - Type /deposit\n✅ Withdraw - Type /withdraw\n✅ View your profile - Type /profile\n";
  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text: body,
      },
    },
  });
}

module.exports = { handleMenu };
