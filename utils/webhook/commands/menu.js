async function handleMenu(user) {
  const text = `
    Welcome to *STAKE IT*!\n \n
    The following commands are available:\n
    /sports - Bet on sports\n
    /stocks - Bet on stocks\n
    /crypto - Bet on cryptocurrency trends (DeGen)\n
    /history - View your bet history\n
    /fund - Fund your account\n
    /fund-status - Check your account balance\n
    /balance - Check your account balance\n
    /withdraw - Withdraw funds\n
    /profile - View your profile\n
    /bet-slips - View your bet slips\n
    /add-funds - Add funds to your account\n
    /accounts - View your accounts\n
    /logout - Logout\n
    `;

  // await sendMessage(user.phone, text);
}

module.exports = { handleMenu };
