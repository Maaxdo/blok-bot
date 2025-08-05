const { twilioClient } = require("../../helpers/webhook/twilio");
const { InfoBipAxios } = require("../../helpers/webhook/infobip");
const { infobip } = require("../../config/app");
const { BlokAxios } = require("../../helpers/webhook/blokbot");
const { WALLET_TYPES } = require("../../constants/wallets");

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
    if (checkKyc && !metadata.hasVerifiedKyc) {
      await InfoBipAxios({
        url: "/whatsapp/1/message/interactive/buttons",
        method: "POST",
        data: {
          from: infobip.phone,
          to: user.phone,
          content: {
            body: {
              text: "⚠️ *Your KYC is not verified*\nPlease complete your KYC to continue",
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
      return;
    }
    if (checkWallet && !metadata.hasWallet) {
      const wallets = await BlokAxios({
        url: "/wallet",
        params: {
          user_id: metadata.userId,
        },
      }).then((res) => res.data.wallets);

      if (WALLET_TYPES.length === wallets.length) {
        user.metadata = {
          ...metadata,
          hasWallet: true,
        };
        await user.save();
        await func(user, message);
        return;
      }

      await InfoBipAxios({
        url: "/whatsapp/1/message/interactive/buttons",
        method: "POST",
        data: {
          from: infobip.phone,
          to: user.phone,
          content: {
            body: {
              text: "⚠️ *You have not yet setup your wallet*\n",
            },
            action: {
              buttons: [
                {
                  type: "REPLY",
                  id: "/wallet:initiate",
                  title: "Create wallet",
                },
              ],
            },
          },
        },
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
      await twilioClient.messages.create({
        body: textBody,
        from: process.env.TWILO_FROM,
        to: `whatsapp:+${user.phone}`,
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
