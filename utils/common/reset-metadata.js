async function resetMetadata(user) {
  user.metadata = {
    token: user.metadata.token,
    userId: user.metadata.userId,
    expiry: user.metadata.expiry,
  };
  await user.save();
}

module.exports = {
  resetMetadata,
};
