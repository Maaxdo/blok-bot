const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { KycSchema } = require("../../schema/kyc");
const { errorParser } = require("../../common/errorParser");
const {
  sendFlow,
  sendText,
  sendInteractiveButtons,
} = require("../../../helpers/bot/infobip");
const { removeCache } = require("../../common/cache");

async function handleStartKyc(user, message) {
  user.state = "/kyc:bvn";
  await user.save();
  await sendFlow({
    user,
    text: "Submit KYC details\n🚀 Get your KYC done in 2 minutes.\nYou will need the following:\n\n- BVN\nClick the message to write in your bvn\n\nForgotten your BVN? Dial *565.0# to retrieve your BVN",
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "1294142805561038",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "WELCOME_SCREEN",
      },
    },
  });
}

async function handleKycBVN(user, message) {
  const validator = KycSchema.safeParse(message);

  if (!validator.success) {
    await sendText({
      user,
      text: "Invalid BVN provided. Please try again.",
    });
    return;
  }

  try {
    await BlokAxios({
      url: "/signup/bvn",
      method: "POST",
      data: {
        phone: user.phone,
        bvn: message.bvn,
      },
    });

    await sendInteractiveButtons({
      user,
      text: "*Congrats!* 🎉\nYour BVN has been successfully verified",
      buttons: user.hasWallet
        ? [
            {
              type: "REPLY",
              id: "/menu",
              title: "View menu",
            },
          ]
        : [
            {
              type: "REPLY",
              id: "/wallet:initiate",
              title: "Generate wallet",
            },
          ],
    });
    await removeCache(`profile_${user.metadata.userId}`);

    if (user.hasWallet) {
      user.state = "/menu";
    }
    user.hasVerifiedKyc = true;

    await user.save();
  } catch (e) {
    await sendText({ user, text: `⚠️ An error occured\n${errorParser(e)}` });
  }
}

async function handleRefreshKyc(user, message) {
  const profile = await BlokAxios({
    url: "/profile",
    params: {
      user_id: user.metadata.userId,
    },
  }).then((res) => res.data);
  await removeCache(`profile_${user.metadata.userId}`);
  if (profile.is_bvn_verified) {
    user.hasVerifiedKyc = true;
    await user.save();
    await sendText({
      user,
      text: "✅ Your KYC is verified",
    });
    return;
  }
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
    ],
  });
}

module.exports = {
  handleStartKyc,
  handleKycBVN,
  handleRefreshKyc,
};
