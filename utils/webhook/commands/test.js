const { sendFlow } = require("../../../helpers/bot/infobip");

async function test(user, message) {
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

module.exports = {
  test,
};
