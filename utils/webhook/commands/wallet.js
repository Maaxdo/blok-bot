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
  // TODO: Check whether user has wallet before creating
  for (const type of WALLET_TYPES) {
    const wallet = await BlokAxios({
      url: "/wallet",
      method: "POST",
      data: {
        wallet_type: type,
        user_id: metadata.userId,
        network: "ethereum",
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
  // await twilioClient.messages.create({
  //   from: process.env.TWILO_FROM,
  //   to: `whatsapp:+${user.phone}`,
  //   contentSid: "HX0e420989bc7f3733f1f288a9404106ea",
  //   contentVariables: JSON.stringify({
  //     1: "USDT",
  //     2: "SOL",
  //     3: "BTC",
  //     4: "ETH",
  //     5: "BNB",
  //   }),
  // });
  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: `Choose from the available wallet options, reply with:\n\nUSDT\nSOL\nBTC\nETH\nBNB`,
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
      logo_url: "string",
      currency_name: "NGN",
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

async function handleWithdraw(user, message) {
  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    contentSid: "HX0e420989bc7f3733f1f288a9404106ea",
    contentVariables: JSON.stringify({
      1: "USDT",
      2: "SOL",
      3: "BTC",
      4: "ETH",
      5: "BNB",
    }),
  });

  user.state = "/withdraw:select";
  await user.save();
}

async function handleWithdrawSelect(user, message) {
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
  user.metadata = {
    ...metadata,
    withdrawWallet: wallet,
  };
  user.state = "/withdraw:amount";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: `You have selected ${wallet} for withdrawal. Please send the amount you want to withdraw.`,
  });
}

async function handleWithdrawAmount(user, message) {
  const amount = parseFloat(message.trim());
  if (isNaN(amount) || amount <= 0) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "Invalid amount. Please enter a valid amount to withdraw.",
    });
    return;
  }

  const metadata = JSON.parse(user.metadata);
  user.metadata = {
    ...metadata,
    withdrawAmount: amount,
  };
  user.state = "/withdraw:address";
  await user.save();
}

async function handleWithdrawAddress(user, message) {
  const address = message.trim();
  if (!address || address.length < 1) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "Invalid wallet address. Please enter a valid wallet address.",
    });
    return;
  }

  const metadata = JSON.parse(user.metadata);
  user.metadata = {
    ...metadata,
    withdrawAddress: address,
  };
  user.state = "/withdraw:pin";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    body: "Please send your wallet pin to confirm the withdrawal.",
  });
}

async function handleWithdrawPin(user, message) {
  const pin = message.trim();
  const validate = WalletPinSchema.safeParse({ pin });

  if (!validate.success) {
    await twilioClient.messages.create({
      from: process.env.TWILO_FROM,
      to: `whatsapp:+${user.phone}`,
      body: "Invalid pin. Please try again.",
    });
  }

  const metadata = JSON.parse(user.metadata);
  user.metadata = {
    ...metadata,
    withdrawPin: pin,
  };
  user.state = "/withdraw:confirm";
  await user.save();

  await twilioClient.messages.create({
    from: process.env.TWILO_FROM,
    to: `whatsapp:+${user.phone}`,
    contentSid: "",
    contentVariables: JSON.stringify({
      1: metadata.withdrawWallet,
      2: metadata.withdrawAmount,
      3: metadata.withdrawAddress,
    }),
  });
}

module.exports = {
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleDeposit,
  handleDepositSelect,
  handleWithdraw,
  handleWithdrawSelect,
  handleWithdrawAmount,
  handleWithdrawAddress,
  handleWithdrawPin,
};
