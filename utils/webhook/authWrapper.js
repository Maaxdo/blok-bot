const { InfoBipAxios } = require("../../helpers/webhook/infobip");
const { infobip } = require("../../config/app");
const { BlokAxios } = require("../../helpers/webhook/blokbot");
const {
  sendText,
  sendInteractiveButtons,
} = require("../../helpers/bot/infobip");
const { getTokens } = require("../common/wallet-options");

function auth(func, checkKyc = false, checkWallet = false) {
  return async (user, message) => {
    if (!user.metadata) {
      const textBody = `
          You are not logged in to your account. Please login to your account to continue:\n
          Use /login to login to your account or /register to register an account
          `;
      await InfoBipAxios({
        url: "/whatsapp/1/message/text",
        method: "POST",
        data: {
          from: infobip.phone,
          to: user.phone,
          content: {
            text: textBody,
          },
        },
      });
      return;
    }

    const metadata = user.metadata;
    if (checkKyc && !user.hasVerifiedKyc) {
      await sendInteractiveButtons({
        user,
        text: "⚠️ *Your KYC is not verified*\nPlease complete your KYC to continue",
        buttons: [
          {
            type: "REPLY",
            id: "/kyc",
            title: "Verify KYC",
          },
        ],
      });
      return;
    }
    if (checkWallet && !user.hasWallet) {
      const wallets = await BlokAxios({
        url: "/wallet",
        params: {
          user_id: metadata.userId,
        },
      }).then((res) => res.data.wallets);

      const tokens = await getTokens();

      if (tokens.length === wallets.length) {
        user.hasWallet = true;
        await user.save();
        await func(user, message);
        return;
      }

      await sendInteractiveButtons({
        user,
        text: "⚠️ *You have not yet setup your wallet*\n",
        buttons: [
          {
            type: "REPLY",
            id: "/wallet:initiate",
            title: "Create wallet",
          },
        ],
      });

      return;
    }

    await func(user, message);
  };
}

function guest(func) {
  return async (user, message) => {
    if (user.metadata) {
      const textBody = `
          You are already logged in to your account:\n
          Use /logout to logout from your account
          `;
      await sendText({
        user,
        text: textBody,
      });
      return;
    }

    await func(user, message);
  };
}

module.exports = {
  auth,
  guest,
};
