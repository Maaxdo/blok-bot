const { sendInteractiveButtons } = require("../../helpers/bot/infobip");

function getCommandExpiry(user, commandCategory) {
  const expiry = user.expiryCommandDatetime;

  if (!expiry || user.expiryCommand !== commandCategory) {
    return false;
  }

  const currentTime = Date.now();

  return currentTime > expiry;
}

async function refreshCommandExpiry(
  user,
  commandCategory,
  durationInMins = 20,
) {
  const expiryDate = new Date(Date.now() + durationInMins * 60 * 1000);

  user.expiryCommand = commandCategory;
  user.expiryCommandDatetime = expiryDate;

  await user.save();
}

async function removeCommandExpiry(user) {
  user.expiryCommand = null;
  user.expiryCommandDatetime = null;
  user.state = "/menu";
  await user.save();
}

async function commandExpiryAction(user, commandCategory, durationInMins = 20) {
  await refreshCommandExpiry(user, commandCategory, durationInMins);
  user.state = "/menu";
  await user.save();
  await sendInteractiveButtons({
    user,
    text: `⚠️ Oops! You have been inactive for ${durationInMins} minutes. Please type /menu to view the menu commands`,
    buttons: user.rememberedState
      ? [
          {
            type: "REPLY",
            id: "/menu",
            title: "Back to menu",
          },
          {
            type: "REPLY",
            id: user.rememberedState,
            title: "Resume",
          },
        ]
      : [
          {
            type: "REPLY",
            id: "/menu",
            title: "Back to menu",
          },
        ],
  });
}

module.exports = {
  getCommandExpiry,
  refreshCommandExpiry,
  removeCommandExpiry,
  commandExpiryAction,
};
