const { sendText } = require("../../../helpers/bot/infobip");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const {
  refreshCommandExpiry,
  removeCommandExpiry,
} = require("../../common/expiry");
const { sendWalletOptions } = require("../../common/wallet-options");
const { WalletSchema } = require("../../schema/wallet");
const { cache } = require("../../common/cache");
const { WALLET_TYPES } = require("../../../constants/wallets");
const { errorParser } = require("../../common/errorParser");

const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

async function handleRates(user, message) {
  // await refreshCommandExpiry(user, "/rates");
  // user.state = "/rates:wallet";
  // await user.save();
  // await sendWalletOptions(user, "Choose from the available crypto options");

  try {
    const rates = await cache(
      "rates",
      async () => {
        const responses = await Promise.allSettled(
          WALLET_TYPES.map((type) =>
            BlokAxios({
              url: `/rates/${type}`,
            }).then((res) => res.data),
          ),
        );
        return responses.map((item) => item.value);
      },
      CACHE_EXPIRY_TIME,
    );
    const ratesString = rates.map((rate) => {
      const lastUpdated = new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(rate.last_updated));
      return `*Wallet type:* ${rate.crypto_symbol}\n*Token name:* ${rate.crypto_name}\n*Buy rate:* ₦${rate.buy.toLocaleString()}\n*Sell rate:* ₦${rate.sell.toLocaleString()}\n*Last updated:* ${lastUpdated}`;
    });
    const text = `Hey there! 🚀\n\nFresh rates just dropped:\n${ratesString.join("\n-----------------------------------------\n")}\n\n⚡ *Ready to trade? Reply with /buy or /sell to get started!*`;
    await sendText({
      user,
      text,
    });
  } catch (err) {
    await sendText({
      user,
      text: "An error occured",
    });
  }
}

async function handleRatesWallet(user, message) {
  const wallet = message.trim();
  const validator = WalletSchema.safeParse({ wallet });

  if (!validator.success) {
    await sendWalletOptions(
      user,
      "⚠ Invalid wallet provided. Please try again.",
    );
    return;
  }
  const res = await BlokAxios({
    url: `/rates/${wallet}`,
  }).then((res) => res.data);
  const lastUpdated = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(res.last_updated));
  const text = `Rate details 💹:\n\n*Wallet type:* ${wallet}\n*Name:* ${res.crypto_name}\n*Buy rate:* ₦${res.buy.toLocaleString()}\n*Sell rate:* ₦${res.sell.toLocaleString()}\n*Current rate:* ₦${res.current_rate.toLocaleString()}\n*Last updated:* ${lastUpdated}`;

  await sendText({ user, text });
  await removeCommandExpiry(user);
}

module.exports = { handleRates, handleRatesWallet };
