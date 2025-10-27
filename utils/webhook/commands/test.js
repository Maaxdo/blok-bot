const { sendFlow } = require("../../../helpers/bot/infobip");

async function test(user, message) {
  await sendFlow({
    user,
    text: 'Your wallet is ready! 🎉 Now, let\'s secure it with a PIN.\nClick on "CONTINUE" to create your 4-digit transaction PIN. 🔒\nThis keeps your wallet safe and only accessible to you. 🔒',
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
