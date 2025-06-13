const { twilioClient } = require("../../../helpers/webhook/twilio");

async function handleMenu(user) {
  const body = `
    Here's what you can do on Blok:\n
    ✅ Buy Crypto - Type /buy\n
    ✅ Sell Crypto - Type /sell\n
    `;
  await twilioClient.messages.create({
    body,
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
  });
}

module.exports = { handleMenu };
