const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");

const options = [
  {
    title: "View your assets",
    id: "/my-assets",
  },
  {
    title: "View rates",
    id: "/rates",
  },
  {
    title: "Buy Crypto",
    id: "/buy",
    nplMessage: 'or "I want to buy crypto"',
  },
  {
    title: "Sell Crypto",
    id: "/sell",
    nplMessage: 'or "I want to sell crypto"',
  },
  {
    title: "View your saved accounts",
    id: "/accounts",
  },
  {
    title: "View your transactions",
    id: "/transactions",
  },

  {
    title: "View your profile",
    id: "/profile",
  },
  {
    title: "Logout",
    id: "/logout",
  },
  {
    title: "Support",
    id: "/support",
  },
];

const optionsString = options
  .map(
    (option) =>
      `✅ ${option.title} - Type *${option.id}* ${option?.nplMessage ?? ""}\n`,
  )
  .join("\n");

async function handleMenu(user) {
  const text = `Here's what you can do on Blok:\n\n${optionsString}`;
  await InfoBipAxios({
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

module.exports = { handleMenu };
