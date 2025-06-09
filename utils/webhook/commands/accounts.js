const { sendMessage } = require("../../../helpers/webhook/whatsapp");
const { WajerAxios } = require("../../../helpers/webhook/wajer");
const { ChatMessage } = require("../../../db/models");
const { chunkify } = require("../../common/chunkify");
const { errorParser } = require("../../common/errorParser");

async function handleViewAccounts(user) {
  const accounts = await WajerAxios({
    url: "/api/recipients",
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
  }).then((res) => res.data);
  const textBody = `
  *Accounts:*\n
  ${accounts.map((account, index) => `${index + 1}. ${account.name} - ${account.account_number}`).join("\n")}\n
  To add an account, type /accounts:add
  `;
  await sendMessage(user.phone, textBody);
}

async function handleViewBanks(user) {
  const banks = await WajerAxios({
    url: "/api/recipients/banks",
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
  }).then((res) => res.data);

  user.state = "/accounts:banks:select";
  await user.save();

  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: "",
    metadata: {
      banks,
    },
  });

  let count = 0;
  for (banksChunks of chunkify(banks, 40)) {
    const textBody = `
    Select a bank to add by sending the corresponding number\n
    ${banksChunks
      .map((bank) => {
        count++;
        return `${count}. ${bank.name}`;
      })
      .join("\n")}
    `;
    await sendMessage(user.phone, textBody);
  }
}

async function handleBankSelect(user, message) {
  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/accounts:banks:select",
    },
    order: [["createdAt", "DESC"]],
  });
  const banks = chatMessage.metadata.banks;
  const bank = banks.find((_, index) => index === Number(message.trim()) - 1);

  if (!bank) {
    await sendMessage(user.phone, "Invalid bank selection");
    return;
  }

  user.state = "/accounts:account-number";
  await user.save();

  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: bank.code,
    metadata: {
      bank,
    },
  });
  const textBody = `Enter the account number for ${bank.name}`;
  await sendMessage(user.phone, textBody);
}

async function handleResolveAccount(user, message) {
  const accountNumber = message.trim();

  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/accounts:account-number",
    },
    order: [["createdAt", "DESC"]],
  });

  if (!chatMessage) {
    user.state = "/accounts:banks:select";
    await user.save();
    await sendMessage(user.phone, "Invalid bank selection");
    return;
  }

  const info = await WajerAxios({
    url: "/api/recipients/resolve",
    method: "POST",
    data: {
      account_number: accountNumber,
      bank_code: chatMessage.body,
    },
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
  }).then((res) => res.data.data);

  const textBody = `
  Confirm that these are the details of the account you want to add\n
  Account number - ${info.account_number}\n
  Account name - ${info.account_name}\n
  Bank - ${chatMessage.metadata.bank.name}\n\n
  Types Yes to confirm or No to cancel
  `;
  user.state = "/accounts:confirm-complete";
  await user.save();
  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: "",
    metadata: {
      bank: chatMessage.metadata.bank,
      info,
    },
  });

  await sendMessage(user.phone, textBody);
}

async function handleConfirmAccount(user, message) {
  const option = message.trim().toLowerCase();

  if (option === "no") {
    user.state = "/accounts:banks:select";
    await user.save();
    await sendMessage(user.phone, "Account addition cancelled");
    return;
  }

  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/accounts:confirm-complete",
    },
    order: [["createdAt", "DESC"]],
  });

  const data = {
    account_number: chatMessage.metadata.info.account_number,
    bank_code: chatMessage.metadata.bank.code,
    name: chatMessage.metadata.info.account_name,
    type: chatMessage.metadata.bank.type,
  };

  try {
    await WajerAxios({
      url: "/api/recipients",
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.apiKey}`,
      },
      data,
    }).then((res) => res.data);
    user.state = null;
    await user.save();
    await sendMessage(user.phone, "Account added successfully");
  } catch (err) {
    await sendMessage(user.phone, errorParser(err));
  }
}

module.exports = {
  handleBankSelect,
  handleViewAccounts,
  handleViewBanks,
  handleResolveAccount,
  handleConfirmAccount,
};
