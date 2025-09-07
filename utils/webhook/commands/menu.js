const { sendText } = require("../../../helpers/bot/infobip");

const options = [
  {
    title: "💰 View your assets",
    id: "/my-assets",
    nplMessage: 'or "I want to view my assets"',
  },
  {
    title: "📜 View your transactions",
    id: "/transactions",
  },
  {
    title: "📊 View rates",
    id: "/rates",
    nplMessage: 'or "I want to see the latest rates"',
  },
  {
    title: "🪙 Buy Crypto",
    id: "/buy",
    nplMessage: 'or "I want to buy crypto"',
  },
  {
    title: "💵 Sell Crypto",
    id: "/sell",
    nplMessage: 'or "I want to sell crypto"',
  },
  {
    title: "💳 View your saved accounts - Type /accounts",
    id: "/accounts",
  },
  {
    title: "🏦 View your address",
    id: "/address",
    nplMessage: 'or "I want to see my address"',
  },
  {
    title: "👤 View your profile - Type /profile",
    id: "/profile",
  },
  {
    title: "🛠 Support - Type /support",
    id: "/support",
  },
  {
    title: "🚪 Logout - Type /logout",
    id: "/logout",
  },
];

const optionsString = options
  .map(
    (option) =>
      `${option.title} - Type *${option.id}* ${option?.nplMessage ?? ""}\n`,
  )
  .join("\n");

async function handleMenu(user) {
  const text = `Here's what you can do on Blok:\n\n${optionsString}`;
  user.state = "/menu";
  await user.save();
  await sendText({
    user,
    text,
  });
}

module.exports = { handleMenu };
