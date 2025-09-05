const { chunkify } = require("./chunkify");
const { sendInteractiveButtons } = require("../../helpers/bot/infobip");
const { cache } = require("./cache");
const { BlokAxios } = require("../../helpers/webhook/blokbot");
const EXPIRY_TIME = 1 * 60 * 60 * 1000;

const getTokens = async () => {
  return cache(
    "cryptos",
    async () => {
      const response = await BlokAxios({
        url: "/crypto/available",
      });
      return response.data;
    },
    EXPIRY_TIME,
  );
};

const getChunkedWalletTypes = async () => {
  const wallets = await getTokens();
  const walletTypes = wallets.map((item) => item.symbol);
  const chunkedWalletTypes = chunkify(walletTypes, 3);
  return chunkedWalletTypes.map((chunk) => {
    return chunk.map((type) => ({
      type: "REPLY",
      id: type,
      title: type,
    }));
  });
};

async function sendWalletOptions(
  user,
  text = "Choose from the available wallet options",
) {
  for (const chunk of await getChunkedWalletTypes()) {
    await sendInteractiveButtons({
      user,
      text,
      buttons: chunk,
    });
  }
}

module.exports = {
  sendWalletOptions,
  getTokens,
};
