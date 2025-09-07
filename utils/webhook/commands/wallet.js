const {
  WalletPinSchema,
  DepositSchema,
  WithdrawSchema,
  BuySchema,
  WalletSchema,
} = require("../../schema/wallet");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { zodErrorParser, errorParser } = require("../../common/errorParser");
const {
  sendInteractiveButtons,
  sendText,
  sendFlow,
} = require("../../../helpers/bot/infobip");
const { cache } = require("../../common/cache");
const {
  refreshCommandExpiry,
  getCommandExpiry,
  commandExpiryAction,
  removeCommandExpiry,
} = require("../../common/expiry");
const { logger } = require("../../common/logger");
const { sendWalletOptions } = require("../../common/wallet-options");

async function handleAssets(user, message) {
  const metadata = user.metadata;
  const wallets = await BlokAxios({
    url: "/user/assets",
    params: {
      user_id: metadata.userId,
    },
  }).then((res) => res.data.wallets);
  const walletsInfo = wallets
    .map(
      (wallet) =>
        `Wallet type 💲: *${wallet.wallet_type}*\nBalance 💰: *${wallet.balance}*\nAddress 📄: ${wallet.address}`,
    )
    .join("\n\n");

  const text = `*Here are your assets* ✅\n\n${walletsInfo}`;
  await sendText({
    user,
    text,
  });
}

async function handleInitiateWalletGeneration(user, message) {
  await sendFlow({
    user,
    text: "Create a secure Pin for your wallet 🔒",
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "1467934914360314",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "PIN_SCREEN",
      },
    },
  });
  user.state = "/wallet:generate";
  await user.save();
}

async function handleGenerateWallet(user, message) {
  const validate = WalletPinSchema.safeParse(message);

  if (!validate.success) {
    const error = zodErrorParser(validate);
    await sendFlow({
      user,
      text: `${error}\n\nPlease try again.`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "1467934914360314",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "PIN_SCREEN",
        },
      },
    });
    return;
  }
  const metadata = user.metadata;

  try {
    const wallets = await BlokAxios({
      url: "/wallet",
      params: {
        user_id: metadata.userId,
      },
    }).then((res) => res.data.wallets);

    const tokens = await cache("cryptos", async () => {
      return await BlokAxios({
        url: "/crypto/available",
      }).then((res) => res.data);
    });

    for (const type of tokens) {
      for (const network of type.networks) {
        const prevWallet = wallets.find(
          (wallet) =>
            wallet.wallet_type === type.symbol && wallet.network === network,
        );
        if (prevWallet) continue;
        const wallet = await BlokAxios({
          url: "/wallet",
          method: "POST",
          data: {
            wallet_type: type.symbol,
            user_id: metadata.userId,
            network,
          },
        }).then((res) => res.data);

        await BlokAxios({
          url: "/wallet/set-pin",
          method: "POST",
          data: {
            wallet_id: wallet.id,
            pin: message.pin,
          },
        });
      }
    }
    user.state = "/menu";
    user.hasWallet = true;
    await user.save();

    const text = !user.hasVerifiedKyc
      ? "Congratulations!🎉\nWallet generation was successful!. Verify your kyc with /kyc"
      : "Congratulations!🎉\nWallet generation was successful!";

    await sendInteractiveButtons({
      user,
      text,
      buttons: !user.hasVerifiedKyc
        ? [
            {
              type: "REPLY",
              id: "/kyc",
              title: "Verify KYC",
            },
          ]
        : [
            {
              type: "REPLY",
              id: "/menu",
              title: "View menu",
            },
          ],
    });
  } catch (e) {
    console.log(JSON.stringify(e));

    await sendText({ user, text: `*An error occurred* ⚠️\n${errorParser(e)}` });
  }
}

async function handleWithdraw(user, message) {
  await sendWalletOptions(user);
  user.state = "/withdraw:select";
  await user.save();
}

async function handleWithdrawSelect(user, message) {
  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });
  if (!validate.success) {
    await sendWalletOptions(user);
    return;
  }

  const metadata = user.metadata;
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/withdraw:options";
  await user.save();

  await sendFlow({
    user,
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "689305550776146",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "WITHDRAW_SCREEN",
      },
    },
    text: `I'll need a few details to process your withdrawal for ${wallet}`,
  });
}

async function handleWithdrawOptions(user, message) {
  const metadata = user.metadata;
  const validator = WithdrawSchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await sendFlow({
      user,
      text: `The details you provided are invalid.\n${error}`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "689305550776146",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "WITHDRAW_SCREEN",
        },
      },
    });
    return;
  }

  try {
    await BlokAxios({
      url: "/crypto/withdraw",
      method: "POST",
      data: {
        user_id: metadata.userId,
        wallet_type: metadata.wallet,
        destination_address: message.address,
        pin: message.pin,
        amount: message.amount,
      },
    });
    await sendText({
      user,
      text: "Withdrawal request received and is being processed",
    });
  } catch (e) {
    await sendText({
      user,
      text: `*An error occurred* ⚠️\n${errorParser(e)}`,
    });
  }
}

async function handleBuy(user, message) {
  user.state = "/buy:select";
  await user.save();
  await sendWalletOptions(user);
  await refreshCommandExpiry(user, "/buy", 20);
}

async function handleBuySelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");

  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }

  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });
  if (!validate.success) {
    await sendWalletOptions(user);
    return;
  }

  const metadata = user.metadata;
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/buy:networks:select";
  await user.save();

  const cryptos = await cache("cryptos", async () => {
    const response = await BlokAxios({
      url: "/crypto/available",
    });
    return response.data;
  });

  const networks =
    cryptos.find((item) => item.symbol === wallet)?.networks || [];

  await sendInteractiveButtons({
    user,
    text: `Select the network you would like to purchase ${wallet} from`,
    buttons: networks.map((network) => ({
      type: "REPLY",
      id: network,
      title: network,
    })),
  });
}

async function handleBuyNetworksSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");
  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }
  const metadata = user.metadata;
  const network = message.trim();

  user.metadata = {
    ...metadata,
    network,
  };
  await user.save();
  await sendInteractiveButtons({
    user,
    text: "Do you want to add a destination address?",
    buttons: [
      {
        type: "REPLY",
        id: "/buy:destination:yes",
        title: "Yes",
      },
      {
        type: "REPLY",
        id: "/buy:destination:no",
        title: "No, fund Blok wallet",
      },
    ],
  });
}

async function handleDestinationAddressPromptYes(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");
  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }
  await sendText({
    user,
    text: "Provide a destination address: (E.g Tr0X...)",
  });
  user.state = "/buy:destination:address";
  await user.save();
}

async function handleDestinationAddressPromptNo(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");
  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }
  const metadata = user.metadata;
  user.state = "/buy:options";
  await user.save();
  await sendFlow({
    user,
    text: `I'll need a few details to process your transaction ${metadata.wallet} on ${metadata.network} network`,
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "24035309786120142",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "BUY_SCREEN",
      },
    },
  });
}

async function handleDestinationAddress(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");
  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }
  const destinationAddress = message.trim();

  if (!destinationAddress || destinationAddress.length === 0) {
    await sendText({
      user,
      text: "Invalid destination address",
    });
    return;
  }

  const metadata = user.metadata;
  user.metadata = {
    ...metadata,
    destinationAddress,
  };
  user.state = "/buy:destination:address:confirm";
  await user.save();
  await sendText({
    user,
    text: "Type in the destination address again to confirm your transaction.\n*Please note that assets sent to the wrong address cannot be recovered*",
  });
}

async function handleDestinationAddressConfirm(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");
  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }
  const confirmDestinationAddress = message.trim();
  const metadata = user.metadata;

  if (metadata.destinationAddress !== confirmDestinationAddress) {
    await sendInteractiveButtons({
      user,
      text: "⚠ Addresses provided do no match",
      buttons: [
        {
          type: "REPLY",
          id: "/buy:destination:yes",
          title: "Try again",
        },
      ],
    });
    return;
  }
  user.state = "/buy:options";
  await user.save();
  await sendFlow({
    user,
    text: `I'll need a few details to process your transaction ${metadata.wallet} on ${metadata.network} network`,
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "24035309786120142",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "BUY_SCREEN",
      },
    },
  });
}

async function handleBuyOptions(user, message) {
  const hasExpired = getCommandExpiry(user, "/buy");

  if (hasExpired) {
    await commandExpiryAction(user, "/buy", 20);
    return;
  }

  const metadata = user.metadata;
  const validator = BuySchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await sendFlow({
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "24035309786120142",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "BUY_SCREEN",
        },
      },
      text: `The details you provided are invalid.\n${error}`,
      user,
    });

    return;
  }

  try {
    const res = await BlokAxios({
      url: "/crypto/buy/fintava",
      method: "POST",
      data: {
        user_id: metadata.userId,
        wallet_type: metadata.wallet,
        currency: metadata.network,
        network: metadata.network,
        pin: message.pin,
        amount: message.amount,
        destination_address: metadata.destinationAddress,
      },
    }).then((res) => res.data);
    user.state = null;
    user.metadata = {
      token: metadata.token,
      userId: metadata.userId,
    };
    await user.save();

    await sendInteractiveButtons({
      user,
      text: `Please transfer the required amount to the details provided to complete your transaction\n\nAmount: *₦ ${res.naira_equivalent.toLocaleString()}*\nAccount number: ${res.deposit_details.account_number}\nBank name: *${res.deposit_details.bank_name}*\nAccount name: *${res.deposit_details.account_name}*`,
      buttons: [
        {
          type: "REPLY",
          id: "/buy:confirm-payment",
          title: "Done",
        },
      ],
    });
    await sendText({
      user,
      text: `${res.deposit_details.account_number}`,
    });
    await removeCommandExpiry(user);
  } catch (e) {
    logger.error("An error occured", e);
    await sendText({
      text: `*An error occurred* ⚠️\n${errorParser(e)}`,
      user,
    });
  }
}

async function handleBuyConfirmPayment(user, message) {
  await sendInteractiveButtons({
    user,
    text: "⏳Your transaction is now processing, your wallet will be credited as soon as payment is confirmed",
    buttons: [
      {
        type: "REPLY",
        id: "/transactions",
        title: "View transactions",
      },
    ],
  });
}

async function handleSell(user, message) {
  await sendWalletOptions(user);
  user.state = "/sell:wallet:select";
  await user.save();
  await refreshCommandExpiry(user, "/sell", 20);
}

async function handleSellWalletSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/sell");

  if (hasExpired) {
    await commandExpiryAction(user, "/sell", 20);
    return;
  }

  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });
  if (!validate.success) {
    await sendWalletOptions(user);
    return;
  }
  const metadata = user.metadata;
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/sell:networks:select";
  await user.save();

  const cryptos = await cache("cryptos", async () => {
    const response = await BlokAxios({
      url: "/crypto/available",
    });
    return response.data;
  });

  const networks =
    cryptos.find((item) => item.symbol === wallet)?.networks || [];

  await sendInteractiveButtons({
    user,
    text: `Select the network you would like to use for ${wallet}`,
    buttons: networks.map((network) => ({
      type: "REPLY",
      id: network,
      title: network,
    })),
  });
}

async function handleSellNetworksSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/sell");
  if (hasExpired) {
    await commandExpiryAction(user, "/sell", 20);
    return;
  }
  const metadata = user.metadata;
  const network = message.trim();

  user.metadata = {
    ...metadata,
    network,
  };
  user.state = "/sell:account:select";
  await user.save();

  const accounts = await BlokAxios({
    url: `/bank/${metadata.userId}`,
  }).then((res) => res.data);

  if (!accounts.length) {
    await sendInteractiveButtons({
      text: "You do not have any bank accounts connected to your account. Please connect a bank account to continue",
      user,
      buttons: [
        {
          type: "REPLY",
          id: "/accounts:add",
          title: "Connect Bank Account",
        },
      ],
    });
    return;
  }

  const accountsList = accounts
    .map(
      (account, index) =>
        `${index + 1} - ${account.bank_name} *${account.account_number}*`,
    )
    .join("\n");
  const text = `Choose from your available accounts \nKindly type “1” to select the first account:\n\n${accountsList}`;
  await sendText({
    user,
    text,
  });
}

async function handleSellAccountSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/sell");

  if (hasExpired) {
    await commandExpiryAction(user, "/sell", 20);
    return;
  }

  const metadata = user.metadata;

  const selectedIndex = parseInt(message.trim()) - 1;

  if (isNaN(selectedIndex)) {
    await sendInteractiveButtons({
      user,
      text: "Invalid account selected. Please try again.",
      buttons: [
        {
          type: "REPLY",
          id: "/sell",
          title: "Sell",
        },
      ],
    });
    return;
  }
  const res = await BlokAxios({
    url: `/bank/${metadata.userId}`,
  }).then((res) => res.data);

  const selectedAccount = res[selectedIndex];

  if (!selectedAccount) {
    await sendInteractiveButtons({
      user,
      text: "Invalid account selected. Please try again.",
      buttons: [
        {
          type: "REPLY",
          id: "/sell",
          title: "Sell",
        },
      ],
    });
    return;
  }

  user.state = "/sell:options";
  user.metadata = {
    ...metadata,
    selectedAccount,
  };
  await user.save();
  await sendFlow({
    user,
    text: "Fill in the details to sell your crypto",
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "1471312790690765",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "SELL_SCREEN",
      },
    },
  });
}

async function handleSellOptions(user, message) {
  const hasExpired = getCommandExpiry(user, "/sell");

  if (hasExpired) {
    await commandExpiryAction(user, "/sell", 20);
    return;
  }

  const validator = BuySchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await sendFlow({
      user,
      text: `The details you provided are invalid.\n${error}`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "1471312790690765",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "SELL_SCREEN",
        },
      },
    });
    return;
  }
  const metadata = user.metadata;

  try {
    const response = await BlokAxios({
      url: "/crypto/sell/fintava",
      method: "POST",
      data: {
        user_id: metadata.userId,
        wallet_type: metadata.wallet,
        bank_account_id: metadata.selectedAccount.id,
        currency: metadata.network,
        network: metadata.network,
        amount: message.amount,
        pin: message.pin,
      },
    }).then((res) => res.data);
    user.state = "/menu";
    await user.save();
    await sendInteractiveButtons({
      user,
      text: `ℹ️ Transaction ${response.transaction_status}, ${response.transfer_details.message}`,
      buttons: [
        {
          type: "REPLY",
          id: "/transactions",
          title: "View transactions",
        },
      ],
    });
    await removeCommandExpiry(user);
  } catch (e) {
    await sendFlow({
      user,
      text: `⚠️ An error occurred.\n${errorParser(e)}`,
      action: {
        mode: "PUBLISHED",
        flowMessageVersion: 3,
        flowToken: "Flow token",
        flowId: "1471312790690765",
        callToActionButton: "Continue",
        flowAction: "NAVIGATE",
        flowActionPayload: {
          screen: "SELL_SCREEN",
        },
      },
    });
    logger.error("Sell error", e);
  }
}

async function handleDeposit(user, message) {
  user.state = "/deposit:wallet";
  await user.save();
  await sendWalletOptions(
    user,
    "Kindly select the token you would like to deposit into",
  );
  await refreshCommandExpiry(user, "/deposit", 20);
}

async function handleDepositWalletSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/deposit");

  if (hasExpired) {
    await commandExpiryAction(user, "/deposit", 20);
    return;
  }

  const wallet = message.trim();
  const validator = WalletSchema.safeParse({ wallet });

  if (!validator.success) {
    await sendInteractiveButtons({
      user,
      text: `⚠️ An error occured\n${zodErrorParser(validator)}`,
      buttons: [
        {
          type: "REPLY",
          id: "/deposit",
          title: "Try Again",
        },
      ],
    });
    return;
  }

  const metadata = user.metadata;
  user.metadata = {
    ...metadata,
    wallet,
  };
  await user.save();

  if (wallet === "USDT") {
    user.state = "/deposit:network";
    await user.save();
    const cryptos = await cache("cryptos", async () => {
      const response = await BlokAxios({
        url: "/crypto/available",
      });
      return response.data;
    });

    const networks =
      cryptos.find((item) => item.symbol === wallet)?.networks || [];

    await sendInteractiveButtons({
      user,
      text: `Select the network you would like to deposit into for ${wallet}`,
      buttons: networks.map((network) => ({
        type: "REPLY",
        id: network,
        title: network,
      })),
    });
    return;
  }

  await handleDepositNetworkSelect(user, "mainnet");
}

async function handleDepositNetworkSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/deposit");

  if (hasExpired) {
    await commandExpiryAction(user, "/deposit", 20);
    return;
  }

  const network = message.trim();
  const metadata = user.metadata;

  // Add network validation and network field to api call
  const address = await BlokAxios({
    url: "/crypto/deposit",
    method: "POST",
    data: {
      user_id: metadata.userId,
      wallet_type: metadata.wallet,
      logo_url: "string",
      currency_name: metadata.wallet,
    },
  }).then((res) => res.data.address);

  user.state = "/menu";
  await user.save();

  await sendText({
    user,
    text: `Here is your deposit address for ${metadata.wallet} on ${network} network 📄\n\n*${address}*`,
  });
  await sendText({
    user,
    text: address,
  });
  await removeCommandExpiry(user);
}

async function handleAddress(user, message) {
  await sendWalletOptions(user);
  user.state = "/address:wallet:select";
  await user.save();
  await refreshCommandExpiry(user, "/sell", 20);
}

async function handleAddressWalletSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/address");

  if (hasExpired) {
    await commandExpiryAction(user, "/address", 20);
    return;
  }
  const wallet = message.trim();
  const validator = WalletSchema.safeParse({ wallet });

  if (!validator.success) {
    await sendWalletOptions(user, "Invalid wallet selected. Try again");
    return;
  }

  const metadata = user.metadata;
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/address:network:select";
  await user.save();

  const cryptos = await cache("cryptos", async () => {
    const response = await BlokAxios({
      url: "/crypto/available",
    });
    return response.data;
  });

  const networks =
    cryptos.find((item) => item.symbol === wallet)?.networks || [];
  await sendInteractiveButtons({
    user,
    text: `Select the network you would like to use for ${wallet}`,
    buttons: networks.map((network) => ({
      type: "REPLY",
      id: network,
      title: network,
    })),
  });
}

async function handleAddressNetworkSelect(user, message) {
  const hasExpired = getCommandExpiry(user, "/address");

  if (hasExpired) {
    await commandExpiryAction(user, "/address", 20);
    return;
  }
  const network = message.trim();
  const userWallets = await BlokAxios({
    url: "/wallet",
    params: {
      user_id: user.metadata.userId,
    },
  }).then((res) => res.data.wallets);
  const selectedWallet = userWallets.find(
    (item) =>
      item.wallet_type === user.metadata.wallet && item.network === network,
  );

  if (!selectedWallet) {
    await sendInteractiveButtons({
      user,
      text: "The wallet you requested for is not available",
      buttons: [
        {
          type: "REPLY",
          title: "Try again",
          id: "/address",
        },
      ],
    });
    return;
  }
  const address = selectedWallet.address;

  await sendText({
    user,
    text: address,
  });
}

module.exports = {
  handleAssets,
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleBuy,
  handleBuySelect,
  handleBuyOptions,
  handleBuyConfirmPayment,
  handleSell,
  handleSellWalletSelect,
  handleSellAccountSelect,
  handleSellOptions,
  handleSellNetworksSelect,
  handleBuyNetworksSelect,
  handleDestinationAddressPromptYes,
  handleDestinationAddressPromptNo,
  handleDestinationAddress,
  handleDestinationAddressConfirm,
  handleAddress,
  handleAddressNetworkSelect,
  handleAddressWalletSelect,
};
