const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");
const { KycSchema } = require("../../schema/kyc");
const { errorParser } = require("../../common/errorParser");

async function handleStartKyc(user, message) {
  user.state = "/kyc:bvn";
  await user.save();
  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/flow",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: "Submit KYC details\n🚀 Get your KYC done in 2 minutes.\nYou will need the following:\n\n- BVN\nClick the message to write in your bvn",
        },
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
      },
    },
  });
}

async function handleKycBVN(user, message) {
  const metadata = user.metadata;
  const validator = KycSchema.safeParse(message);

  if (!validator.success) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: "Invalid BVN provided. Please try again.",
        },
      },
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
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "*Congrats!* 🎉\nYour BVN has been successfully verified",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/menu",
                title: "View menu",
              },
            ],
          },
        },
      },
    });
    user.state = "/menu";
    user.metadata = {
      ...metadata,
      hasVerifiedKyc: true,
    };
    await user.save();
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: errorParser(e),
        },
      },
    });
  }
}

module.exports = {
  handleStartKyc,
  handleKycBVN,
};
