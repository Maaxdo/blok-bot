const { sendText } = require("../../../helpers/bot/infobip");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { cache } = require("../../common/cache");
const { getTokens } = require("../../common/wallet-options");

const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

async function handleRates(user, message) {
  try {
    const rates = await cache(
      "rates",
      async () => {
        const tokens = await getTokens();
        const responses = await Promise.allSettled(
          tokens.map((type) =>
            BlokAxios({
              url: `/rates/${type.symbol}`,
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

    console.log(text);

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

module.exports = { handleRates };
