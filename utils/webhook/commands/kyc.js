const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { KycSchema } = require("../../schema/kyc");
const { errorParser } = require("../../common/errorParser");
const {
  sendFlow,
  sendText,
  sendInteractiveButtons,
} = require("../../../helpers/bot/infobip");

async function handleStartKyc(user, message) {
  user.state = "/kyc:bvn";
  await user.save();
  await sendFlow({
    user,
    text: "Submit KYC details\n🚀 Get your KYC done in 2 minutes.\nYou will need the following:\n\n- BVN\nClick the message to write in your bvn",
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
  const metadata = user.metadata;
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
      buttons: [
        {
          type: "REPLY",
          id: "/menu",
          title: "View menu",
        },
      ],
    });
    user.state = "/menu";
    user.hasVerifiedKyc = true;

    await user.save();
  } catch (e) {
    await sendText({ user, text: `⚠️ An error occured\n${errorParser(e)}` });
  }
}

module.exports = {
  handleStartKyc,
  handleKycBVN,
};
