const { sendInteractiveMessage } = require("../../../helpers/webhook/whatsapp");

async function sendInteractiveTest(user) {
  const message = {
    type: "list",
    header: {
      type: "text",
      text: "Choose a Sport",
    },
    body: {
      text: "Please select one of the sports below:",
    },
    action: {
      button: "Select Sport",
      sections: [
        {
          title: "Sports",
          rows: [
            {
              id: "/sports-sports_choice-Soccer",
              title: "Football",
            },
            {
              id: "/sports-sports_choice-Basketball",
              title: "Basketball",
            },
            {
              id: "/sports-sports_choice-Tennis",
              title: "Tennis",
            },
          ],
        },
      ],
    },
  };
  await sendInteractiveMessage(user.phone, message);
}

module.exports = {
  sendInteractiveTest,
};
