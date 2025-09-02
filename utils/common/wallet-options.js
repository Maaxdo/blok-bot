const { WALLET_TYPES } = require("../../constants/wallets");
const { chunkify } = require("./chunkify");
const { sendInteractiveButtons } = require("../../helpers/bot/infobip");

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

async function sendWalletOptions(
  user,
  text = "Choose from the available wallet options",
) {
  for (const chunk of getChunkedWalletTypes()) {
    await sendInteractiveButtons({
      user,
      text,
      buttons: chunk,
    });
  }
}

module.exports = {
  sendWalletOptions,
};
