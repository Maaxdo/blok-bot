const { BlokAxios } = require("../../helpers/webhook/blokbot");
const {
  sendText,
  sendInteractiveButtons,
} = require("../../helpers/bot/infobip");
const { getTokens } = require("../common/wallet-options");
const { cache } = require("../common/cache");

function auth(func, checkKyc = false, checkWallet = false) {
  return async (user, message) => {
    if (!user.metadata) {
      const textBody = `
          You are not logged in to your account. Please login to your account to continue:\n
          Use /login to login to your account or /register to register an account
          `;
      await sendText({
        user,
        text: textBody,
      });
      return;
    }

    const metadata = user.metadata;

    const profile = cache(
      `profile_${metadata.userId}`,
      async () => {
        return await BlokAxios({
          url: "/profile",
          params: {
            user_id: metadata.userId,
          },
        }).then((res) => res.data);
      },
      10 * 60 * 1000,
    );

    if (checkKyc && profile.is_bvn_verified) {
      user.hasVerifiedKyc = true;
      await user.save();
      await func(user, message);
      return;
    }

    if (!profile.is_bvn_verified && checkKyc) {
      user.hasVerifiedKyc = false;
      await user.save();
      await sendInteractiveButtons({
        user,
        text: "⚠️ *Your KYC is not verified*\nPlease complete your KYC to continue",
        buttons: [
          {
            type: "REPLY",
            id: "/kyc",
            title: "Verify KYC",
          },
          {
            type: "REPLY",
            id: "/kyc:refresh",
            title: "Refresh KYC",
          },
        ],
      });
      return;
    }

    // if (checkKyc && !user.hasVerifiedKyc) {
    //   await sendInteractiveButtons({
    //     user,
    //     text: "⚠️ *Your KYC is not verified*\nPlease complete your KYC to continue",
    //     buttons: [
    //       {
    //         type: "REPLY",
    //         id: "/kyc",
    //         title: "Verify KYC",
    //       },
    //       {
    //         type: "REPLY",
    //         id: "/kyc:refresh",
    //         title: "Refresh KYC",
    //       },
    //     ],
    //   });
    //   return;
    // }
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
