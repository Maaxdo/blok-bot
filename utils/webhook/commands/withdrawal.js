const { sendMessage } = require("../../../helpers/webhook/whatsapp");
const { ChatMessage } = require("../../../db/models");
const { WajerAxios } = require("../../../helpers/webhook/wajer");
const { errorParser } = require("../../common/errorParser");

async function handleViewAccountDetails(user) {
  const accounts = await WajerAxios({
    url: "/api/recipients",
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
  }).then((res) => res.data);

  const textBody = `
      *Select an account with the number E.g 1*\n
      ${accounts.map((account, index) => `${index + 1}. ${account.name} - ${account.account_number}`).join("\n")}\n
      To add an account, type /accounts:add
      `;
  user.state = "/withdraw:account:select";
  await user.save();

  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: "",
    metadata: {
      accounts,
    },
  });

  await sendMessage(user.phone, textBody);
}

async function handleSelectAmount(user, message) {
  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/withdraw:account:select",
    },
    order: [["createdAt", "DESC"]],
  });
  const accounts = chatMessage.metadata.accounts;
  const selectedIndex = Number(message.trim()) - 1;
  const account = accounts[selectedIndex];

  if (!account) {
    await sendMessage(user.phone, "Invalid account selected");
    return;
  }

  const textBody = "Enter the amount you want to withdraw";

  user.state = "/withdraw:amount";
  await user.save();

  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: "",
    metadata: {
      account,
    },
  });

  await sendMessage(user.phone, textBody);
}

async function handleConfirmAmount(user, message) {
  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/withdraw:amount",
    },
    order: [["createdAt", "DESC"]],
  });

  const account = chatMessage.metadata.account;
  const amount = Number(message.trim());

  if (isNaN(amount) || amount <= 0) {
    await sendMessage(user.phone, "Invalid amount entered");
    return;
  }

  user.state = "/withdraw:confirm";
  await user.save();
  await ChatMessage.create({
    userId: user.id,
    state: "/withdraw:confirm",
    body: "",
    metadata: {
      account,
      amount,
    },
  });

  const textBody = `
Confirm withdraw of NGN ${amount.toLocaleString()} from\n
${account.name} - ${account.account_number}?\n
Reply with 'yes' to confirm or 'no' to cancel
  `;
  await sendMessage(user.phone, textBody);
}

async function handleProceed(user, message) {
  const option = message.trim().toLowerCase();

  if (option !== "yes") {
    user.state = null;
    await user.save();
    await sendMessage(user.phone, "Withdrawal cancelled");
    return;
  }

  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/withdraw:confirm",
    },
    order: [["createdAt", "DESC"]],
  });

  try {
    await WajerAxios({
      url: "/api/recipients/withdraw",
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.apiKey}`,
      },
      data: {
        amount: chatMessage.metadata.amount,
        recipient_id: chatMessage.metadata.account.id,
      },
    }).then((res) => res.data);
    user.state = null;
    await user.save();
    await sendMessage(
      user.phone,
      "Withdrawal successfull. You should receive your funds shortly",
    );
  } catch (err) {
    await sendMessage(user.phone, errorParser(err));
  }
}

module.exports = {
  handleViewAccountDetails,
  handleSelectAmount,
  handleConfirmAmount,
  handleProceed,
};
