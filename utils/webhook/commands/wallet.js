const {
  WalletPinSchema,
  DepositSchema,
  WithdrawSchema,
  BuySchema,
} = require("../../schema/wallet");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { WALLET_TYPES } = require("../../../constants/wallets");
const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");
const { zodErrorParser, errorParser } = require("../../common/errorParser");
const { chunkify } = require("../../common/chunkify");

const getChunkedWalletTypes = () => {
  const chunkedWalletTypes = chunkify(WALLET_TYPES, 3);
  return chunkedWalletTypes.map((chunk) => {
    return chunk.map((type) => ({
      type: "REPLY",
      id: type,
      title: type,
    }));
  });
};

async function sendWalletOptions(user) {
  for (const chunk of getChunkedWalletTypes()) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Choose from the available wallet options",
          },
          action: {
            buttons: chunk,
          },
        },
      },
    });
  }
}

async function handleAssets(user, message) {
  const metadata = JSON.parse(user.metadata);
  const wallets = await BlokAxios({
    url: "/user/assets",
    params: {
      user_id: metadata.userId,
    },
  }).then((res) => res.data.wallets);
  const walletsInfo = wallets
    .map(
      (wallet) =>
        `Wallet type 💲: *${wallet.wallet_type}*\nBalance 💰: *${wallet.balance}*\nAddress 📄: *${wallet.address}*\nActive ✅: *${wallet.is_active ? "Yes" : "No"}*\nLocked 🔒: *${wallet.is_locked ? "Yes" : "No"}*`,
    )
    .join("\n\n");

  const text = `*Here are your assets* ✅\n\n${walletsInfo}`;
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
async function handleInitiateWalletGeneration(user, message) {
  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: "Create a secure Pin for your wallet 🔒",
        },
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
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `${error}\n\nPlease try again.`,
          },
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
        },
      },
    });
    return;
  }
  const metadata = JSON.parse(user.metadata);
  // TODO: Check whether user has wallet before creating

  try {
    const wallets = await BlokAxios({
      url: "/wallet",
      params: {
        user_id: metadata.userId,
      },
    }).then((res) => res.data.wallets);

    for (const type of WALLET_TYPES) {
      const prevWallet = wallets.find((wallet) => wallet.wallet_type === type);
      if (prevWallet) continue;
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
          pin: message.pin,
        },
      });
    }
    user.state = "/menu";
    user.metadata = {
      ...metadata,
      hasWallet: true,
    };
    await user.save();

    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Congratulations!🎉\nWallet generation was successful!. Verify your kyc with /kyc",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/kyc",
                title: "Verify KYC",
              },
            ],
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `*An error occured* ⚠️\n${errorParser(e)}`,
        },
      },
    });
  }
}

async function handleDeposit(user, message) {
  await sendWalletOptions(user);

  user.state = "/deposit:wallet";
  await user.save();
}

async function handleDepositWalletSelect(user, message) {
  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });

  if (!validate.success) {
    await sendWalletOptions(user);
    return;
  }

  const prev = JSON.parse(user.metadata);
  user.metadata = {
    ...prev,
    wallet,
  };

  user.state = "/deposit:network";
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/buttons",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: `Choose from the available networks for ${wallet}`,
        },
        action: {
          buttons: [
            {
              type: "REPLY",
              id: "testnet",
              title: "Testnet",
            },
          ],
        },
      },
    },
  });
}

async function handleDepositNetworkSelect(user, message) {
  const network = message.trim().toUpperCase();
  const metadata = JSON.parse(user.metadata);

  const res = await BlokAxios({
    url: "/crypto/deposit",
    method: "POST",
    data: {
      user_id: metadata.userId,
      wallet_type: metadata.wallet,
      logo_url: "string",
      currency_name: "NGN",
      network,
    },
  }).then((res) => res.data);

  user.state = "/menu";
  user.metadata = {
    token: metadata.token,
    userId: metadata.userId,
  };
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text: `*Deposit Info* ℹ️\n\n*Wallet*: ${res.wallet_type}\n*Wallet address*: ${res.address}\n*Network*: ${res.network}`,
      },
    },
  });
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

  const metadata = JSON.parse(user.metadata);
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/withdraw:options";
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: `I’ll need a few details to process your withdrawal for ${wallet}`,
        },
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
      },
    },
  });
}

async function handleWithdrawOptions(user, message) {
  const metadata = JSON.parse(user.metadata);
  const validator = WithdrawSchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `The details you provided are invalid.\n${error}`,
          },
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
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: "Withdrawal request received and is being processed",
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `*An error occurred* ⚠️\n${errorParser(e)}`,
        },
      },
    });
  }
}

async function handleBuy(user, message) {
  await sendWalletOptions(user);
  user.state = "/buy:select";
  await user.save();
}

async function handleBuySelect(user, message) {
  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });
  if (!validate.success) {
    await sendWalletOptions(user);
    return;
  }

  const metadata = JSON.parse(user.metadata);
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/buy:options";
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: `I’ll need a few details to process your transaction ${wallet}`,
        },
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
      },
    },
  });
}

async function handleBuyOptions(user, message) {
  const metadata = JSON.parse(user.metadata);
  const validator = BuySchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `The details you provided are invalid.\n${error}`,
          },
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
        },
      },
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
        currency: metadata.wallet,
        pin: message.pin,
        amount: message.amount,
      },
    }).then((res) => res.data);
    user.state = "/menu";
    await user.save();
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `Please transfer the required amount to the details provided to complete your transaction\n\nAmount: *₦ ${res.naira_equivalent.toLocaleString()}*\nAccount number: *${res.deposit_details.account_number}*\nBank name: *${res.deposit_details.bank_name}*\nAccount number: *${res.deposit_details.account_name}*`,
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `*An error occurred* ⚠️\n${errorParser(e)}`,
        },
      },
    });
  }
}

async function handleSell(user, message) {
  await sendWalletOptions(user);
  user.state = "/sell:wallet:select";
  await user.save();
}

async function handleSellWalletSelect(user, message) {
  const wallet = message.trim().toUpperCase();
  const validate = DepositSchema.safeParse({ wallet });
  if (!validate.success) {
    await sendWalletOptions(user);
    return;
  }
  const metadata = JSON.parse(user.metadata);
  user.metadata = {
    ...metadata,
    wallet,
  };
  user.state = "/sell:account:select";
  await user.save();

  const accounts = await BlokAxios({
    url: `/bank/${metadata.userId}`,
  }).then((res) => res.data);

  if (!accounts.length) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "You do not have any bank accounts connected to your account. Please connect a bank account to continue",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:add",
                title: "Connect Bank Account",
              },
            ],
          },
        },
      },
    });
    return;
  }

  const accountsList = accounts
    .map(
      (account, index) =>
        `${index + 1} - ${account.bank_name} *${account.account_number}*`,
    )
    .join("\n");
  const text = `Choose from your available accounts :\n\n${accountsList}`;
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

async function handleSellAccountSelect(user, message) {
  const metadata = JSON.parse(user.metadata);

  const selectedIndex = parseInt(message.trim()) - 1;

  if (isNaN(selectedIndex)) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Invalid account selected. Please try again.",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/sell",
                title: "Sell",
              },
            ],
          },
        },
      },
    });
    return;
  }
  const res = await BlokAxios({
    url: `/bank/${metadata.userId}`,
  }).then((res) => res.data);

  const selectedAccount = res[selectedIndex];

  if (!selectedAccount) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Invalid account selected. Please try again.",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/sell",
                title: "Sell",
              },
            ],
          },
        },
      },
    });
    return;
  }

  user.state = "/sell:options";
  user.metadata = {
    ...metadata,
    selectedAccount,
  };
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: "Fill in the details to sell your crypto",
        },
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
      },
    },
  });
}

async function handleSellOptions(user, message) {
  const validator = BuySchema.safeParse(message);

  if (!validator.success) {
    const error = zodErrorParser(validator);
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `The details you provided are invalid.\n${error}`,
          },
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
        },
      },
    });
    return;
  }
  const metadata = JSON.parse(user.metadata);

  try {
    const response = await BlokAxios({
      url: "/crypto/sell/fintava",
      method: "POST",
      data: {
        user_id: metadata.userId,
        wallet_type: metadata.wallet,
        bank_account_id: metadata.selectedAccount.id,
        currency: metadata.wallet,
        ...message,
      },
    }).then((res) => res.data);
    user.state = "/menu";
    await user.save();
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `ℹ️ Transaction ${response.transaction_status}, ${response.transfer_details.message}`,
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/menu",
                title: "Menu",
              },
            ],
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/flow",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `⚠️ An error occurred.\n${errorParser(e)}`,
          },
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
        },
      },
    });
  }
}

module.exports = {
  handleAssets,
  handleInitiateWalletGeneration,
  handleGenerateWallet,
  handleDeposit,
  handleDepositWalletSelect,
  handleDepositNetworkSelect,
  handleWithdraw,
  handleWithdrawSelect,
  handleWithdrawOptions,
  handleBuy,
  handleBuySelect,
  handleBuyOptions,
  handleSell,
  handleSellWalletSelect,
  handleSellAccountSelect,
  handleSellOptions,
};
