const { twilioClient } = require("../../../helpers/webhook/twilio");
const { WalletPinSchema } = require("../../schema/wallet");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");

//  "SOL",
const WALLET_TYPES = ["USDT", "BTC", "ETH", "BNB"];

async function handleInitiateWalletGeneration(user, message) {
  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "Send a 4 digit pin for your wallet to be generated.",
  });

  user.state = "/wallet:generate";
  await user.save();
}

async function handleGenerateWallet(user, message) {
  const pin = message.trim();
  const validate = WalletPinSchema.safeParse({ pin });

  if (!validate.success) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "Invalid pin. Please try again.",
    });
    return;
  }
  const metadata = JSON.parse(user.metadata);

  for (const type of WALLET_TYPES) {
    const wallet = await BlokAxios({
      url: "/wallet",
      method: "POST",
      data: {
        wallet_type: type,
        user_id: metadata.userId,
      },
    }).then((res) => res.data);

    await BlokAxios({
      url: "/wallet/set-pin",
      method: "POST",
      data: {
        wallet_id: wallet.id,
        pin,
      },
    });

    console.log(type, wallet.id);
  }

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "Your wallet has been generated successfully.",
  });
}

module.exports = {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
};
