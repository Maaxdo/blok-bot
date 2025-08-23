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

module.exports = {
  getCommandExpiry,
  refreshCommandExpiry,
  removeCommandExpiry,
};
