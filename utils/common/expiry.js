const { sendInteractiveButtons } = require("../../helpers/bot/infobip");

function getCommandExpiry(user, commandCategory) {
  const expiry = user.expiryCommandDatetime;

  if (!expiry || user.expiryCommand !== commandCategory) {
    return false;
  }

  const currentTime = Date.now();

  return currentTime > expiry;
}

async function refreshCommandExpiry(user, commandCategory, durationInMins) {
  const currentTime = Date.now();
  const expiryDate = new Date(currentTime + durationInMins * 60 * 1000);

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

async function commandExpiryAction(user, commandCategory, durationInMins) {
  await refreshCommandExpiry(user, commandCategory, durationInMins);
  user.state = "/menu";
  await user.save();
  await sendInteractiveButtons({
    user,
    text: "❌ Oops! You have been inactive for 20 minutes and your previous session has timed out. Please type /menu to view the menu commands",
    buttons: [
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
