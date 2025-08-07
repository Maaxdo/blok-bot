const { sendText } = require("../../../helpers/bot/infobip");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");

async function handleRates(user, message) {
  const res = await BlokAxios({
    url: "/admin/rates",
  }).then((res) => res.data);
  const buyRates = res
    .map(
      (rate) =>
        `*${rate.currency_pair}* - ${parseFloat(rate.buy_rate).toLocaleString()}`,
    )
    .join("\n");
  const sellRates = res
    .map(
      (rate) =>
        `*${rate.currency_pair}* - ${parseFloat(rate.sell_rate).toLocaleString()}`,
    )
    .join("\n");

  await sendText({
    user,
    text: `💰BUY RATES💰\n\n${buyRates}`,
  });
  await sendText({
    user,
    text: `💰SELL RATES💰\n\n${sellRates}`,
  });
}

module.exports = { handleRates };
