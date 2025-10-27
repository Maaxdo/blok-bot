const { sendFlow } = require("../../../helpers/bot/infobip");

async function test(user, message) {
  await sendFlow({
    user,
    text: 'Your wallet is all set! 🎉\nTap "Continue" to create your 4-digit transaction PIN and start your Blok experience. 💜',
    action: {
      mode: "PUBLISHED",
      flowMessageVersion: 3,
      flowToken: "Flow token",
      flowId: "1467934914360314",
      callToActionButton: "Continue",
      flowAction: "NAVIGATE",
      flowActionPayload: {
        screen: "PIN_SCREEN",
      },
    },
  });
}

module.exports = {
  test,
};
