function getCommandExpiry(user, commandCategory) {
  const expiry = user.metadata?.expiry;

  if (!expiry || expiry.commandCategory !== commandCategory) {
    return false;
  }

  const currentTime = Date.now();

  return currentTime > expiry.datetime;
}

async function refreshCommandExpiry(user, commandCategory, durationInMins) {
  const currentTime = Date.now();
  const expiryDate = new Date(currentTime + durationInMins * 60 * 1000);

  user.metadata = {
    ...user.metadata,
    expiry: {
      commandCategory,
      datetime: expiryDate,
    },
  };

  await user.save();
}

module.exports = {
  getCommandExpiry,
  refreshCommandExpiry,
};
