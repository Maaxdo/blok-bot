const { sendText } = require("../../../helpers/bot/infobip");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const {
  refreshCommandExpiry,
  removeCommandExpiry,
} = require("../../common/expiry");
const { sendWalletOptions } = require("../../common/wallet-options");
const { WalletSchema } = require("../../schema/wallet");

async function handleRates(user, message) {
  await refreshCommandExpiry(user, "/rates");
  user.state = "/rates:wallet";
  await user.save();
  await sendWalletOptions(user);
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
