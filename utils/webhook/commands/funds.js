const { WajerAxios } = require("../../../helpers/webhook/wajer");
const { sendMessage } = require("../../../helpers/webhook/whatsapp");

async function handleAddFund(user) {
  const textBody = `Enter the amount you want to fund your account with`;
  user.state = "/add-funds:amount";
  await user.save();
  await sendMessage(user.phone, textBody);
}

async function handleAddFundAction(user, message) {
  const amount = parseFloat(message.trim());
  if (isNaN(amount)) {
    await sendMessage(
      user.phone,
      "Invalid amount. Please enter a valid amount",
    );
    return;
  }

  const response = await WajerAxios({
    url: "/api/add-fund",
    method: "POST",
    data: {
      amount,
    },
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
  }).then((res) => res.data);
  const paymentUrl = response.data.authorization_url;

  await sendMessage(
    user.phone,
    `Click on the link to make payment: ${paymentUrl}`,
  );
}

module.exports = {
  handleAddFund,
  handleAddFundAction,
};
