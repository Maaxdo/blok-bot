const { twilioClient } = require("../../../helpers/webhook/twilio");
const { WalletPinSchema, DepositSchema } = require("../../schema/wallet");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { WALLET_TYPES } = require("../../../constants/wallets");

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
  }

  user.state = "/menu";
  user.metadata = {
    ...metadata,
    hasWallet: true,
  };
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "Your wallet has been generated successfully. Use /menu to view our services",
  });
}

async function handleDeposit(user, message) {
  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    contentSid: "HX05fe8a0020c792d5f0c95a03244cbc7d",
    contentVariables: JSON.stringify({
      1: "USDT",
      2: "SOL",
      3: "BTC",
      4: "ETH",
      5: "BNB",
    }),
  });

  user.state = "/deposit:select";
  await user.save();
}

async function handleDepositSelect(user, message) {
  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });

  if (!validate.success) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "Invalid wallet selected",
    });
    return;
  }

  const metadata = JSON.parse(user.metadata);

  const res = await BlokAxios({
    url: "/crypto/deposit",
    method: "POST",
    data: {
      user_id: metadata.userId,
      wallet_type: wallet,
    },
  }).then((res) => res.data);

  user.state = "/menu";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: `You can deposit to your ${wallet} 💰🪙 address with the info below\n\n*WALLET ADDRESS:* ${res.address}\n*NETWORK:* ${res.network}`,
  });
}

module.exports = {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleDeposit,
  handleDepositSelect,
};
