function auth(func) {
  return async (user, message) => {
    if (!user.metadata) {
      const textBody = `
          You are not logged in to your account. Please login to your account to continue:\n
          Use /login to login to your account
          `;
      // await sendMessage(user.phone, textBody);
      return;
    }
    await func(user, message);
  };
}

function guest(func) {
  return async (user, message) => {
    if (user.metadata) {
      const textBody = `
          You are already logged in to your account:\n
          Use /logout to logout from your account
          `;
      // await sendMessage(user.phone, textBody);
      return;
    }

    await func(user, message);
  };
}

module.exports = {
  auth,
  guest,
};
