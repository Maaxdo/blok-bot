const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");
const { errorParser, zodErrorParser } = require("../../common/errorParser");
const { cache } = require("../../common/cache");
const { paginate } = require("../../common/paginate");
const { getPaginationButtons } = require("../../common/pagination");
const {
  sendText,
  sendInteractiveButtons,
} = require("../../../helpers/bot/infobip");
const { BankSearchSchema } = require("../../schema/accounts");

async function getBanks() {
  return BlokAxios({
    url: "/banks",
  }).then((res) => res.data.banks);
}

async function handleAccounts(user, message) {
  try {
    const metadata = user.metadata;
    const res = await BlokAxios({
      url: `/bank/${metadata.userId}`,
    });

    const text = !res.data.length
      ? "You do not have any saved accounts"
      : res.data
          .map(
            (account) =>
              `Account name: *${account.account_name}*\nAccount number: *${account.account_number}*\nBank: *${account.bank_name}*\nActive: ${account.is_active ? "Yes" : "No"}`,
          )
          .join("\n\n");

    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text,
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:add",
                title: "Add account",
              },
              {
                type: "REPLY",
                id: "/accounts:delete",
                title: "Delete an account",
              },
            ],
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `⚠️An error occurred\n${errorParser(e)}`,
        },
      },
    });
  }
}

async function handleAccountAdd(user, message) {
  await sendText({
    user,
    text: "Enter the first three letters of the bank you want to add an account to",
  });
  user.state = "/accounts:banks";
  await user.save();
}

async function handleBankOptions(user, message) {
  const metadata = user.metadata;
  const validator = BankSearchSchema.safeParse({
    bank: message.trim(),
  });

  if (!validator.success) {
    await sendText({
      user,
      text: `⚠️ Invalid options provided\n${zodErrorParser(validator)}`,
    });
    return;
  }
  const banks = await cache("banks", getBanks);
  const items = banks.filter((bank) =>
    bank.name.toLowerCase().startsWith(message.trim().toLowerCase()),
  );
  user.metadata = {
    ...metadata,
    banks: items,
  };
  user.state = "/accounts:banks:select";
  await user.save();
  const banksString = items
    .map((bank, index) => `${index + 1} -  *${bank.name}*`)
    .join("\n");

  const text = `Select the bank you want to add an account to :\n\n${banksString}`;

  await sendInteractiveButtons({
    user,
    buttons: [
      {
        type: "REPLY",
        id: "/accounts:add",
        title: "Search again",
      },
    ],
    text,
  });
}

async function handleBankSelect(user, message) {
  const metadata = user.metadata;
  const banks = metadata.banks;
  const selectedIndex = parseInt(message.trim()) - 1;
  const selectedBank = banks[selectedIndex];

  if (!selectedBank) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Invalid bank selected. Please try again.",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:add",
                title: "Add account",
              },
            ],
          },
        },
      },
    });
    return;
  }

  user.metadata = {
    ...metadata,
    selectedBank,
  };
  user.state = "/accounts:add:number";
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text: `Enter the account number for your *${selectedBank.name}* account`,
      },
    },
  });
}

async function handleAccountAddNumber(user, message) {
  const metadata = user.metadata;
  const accountNumber = message.trim();

  try {
    const res = await BlokAxios({
      url: "/verify-bank",
      method: "POST",
      data: {
        account_number: accountNumber,
        bank_code: metadata.selectedBank.code,
      },
    }).then((res) => res.data);
    user.metadata = {
      ...metadata,
      accountNumber,
    };
    await user.save();
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `Account details:\n\nAccount number: *${accountNumber}*\nAccount name: *${res.account_name}*`,
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:add:confirm",
                title: "Confirm",
              },
              {
                type: "REPLY",
                id: "/accounts:add:cancel",
                title: "Cancel",
              },
            ],
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `⚠️ An error occurred\n${errorParser(e)}`,
        },
      },
    });
  }
}

async function handleAccountAddConfirm(user, message) {
  const metadata = user.metadata;

  try {
    await BlokAxios({
      url: "/bank",
      method: "POST",
      data: {
        account_number: metadata.accountNumber,
        bank_name: metadata.selectedBank.name,
        user_id: metadata.userId,
        is_default: false,
      },
    });
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "✅ Account added successfully!\nYou can now view your accounts",
            action: {
              buttons: [
                {
                  type: "REPLY",
                  id: "/accounts",
                  title: "View accounts",
                },
              ],
            },
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/text",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          text: `⚠️ An error occurred\n${errorParser(e)}`,
        },
      },
    });
  }
}

async function handleAccountAddCancel(user, message) {
  const metadata = user.metadata;
  user.state = "/menu";
  user.metadata = {
    token: metadata.token,
    userId: metadata.userId,
  };
  await user.save();
  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/buttons",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: "Account add cancelled!",
        },
        action: {
          buttons: [
            {
              type: "REPLY",
              id: "/menu",
              title: "View menu",
            },
          ],
        },
      },
    },
  });
}

async function handleAccountDelete(user, message) {
  const metadata = user.metadata;
  const res = await BlokAxios({
    url: `/bank/${metadata.userId}`,
  }).then((res) => res.data);
  const accounts = res
    .map(
      (account, index) =>
        `${index + 1} - ${account.bank_name} *${account.account_number}*`,
    )
    .join("\n");
  const text = `Select the account you want to delete :\n\n${accounts}`;
  user.state = "/accounts:delete:select";
  await user.save();
  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        text,
      },
    },
  });
}

async function handleAccountDeleteSelect(user, message) {
  const metadata = user.metadata;

  const selectedIndex = parseInt(message.trim()) - 1;

  if (isNaN(selectedIndex)) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Invalid account selected. Please try again.",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:delete",
                title: "Delete account",
              },
            ],
          },
        },
      },
    });
    return;
  }
  const res = await BlokAxios({
    url: `/bank/${metadata.userId}`,
  }).then((res) => res.data);

  const selectedAccount = res[selectedIndex];

  if (!selectedAccount) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: "Invalid account selected. Please try again.",
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:delete",
                title: "Delete account",
              },
            ],
          },
        },
      },
    });
    return;
  }

  const text = `Are you sure you want to delete the account *${selectedAccount.bank_name}* *${selectedAccount.account_number}*?`;
  user.state = "/accounts:delete:confirm";
  user.metadata = {
    ...metadata,
    selectedAccount,
  };
  await user.save();

  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/buttons",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text,
        },
        action: {
          buttons: [
            {
              type: "REPLY",
              id: "/accounts:delete:confirm",
              title: "Confirm",
            },
            {
              type: "REPLY",
              id: "/accounts:delete:cancel",
              title: "Cancel",
            },
          ],
        },
      },
    },
  });
}

async function handleAccountDeleteConfirm(user, message) {
  const metadata = user.metadata;
  const { selectedAccount } = metadata;
  try {
    await BlokAxios({
      url: `/bank/${selectedAccount.id}`,
      method: "DELETE",
      params: {
        user_id: metadata.userId,
      },
    });
    user.state = "/menu";
    await user.save();
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: { text: "Account deleted successfully!" },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts",
                title: "View accounts",
              },
            ],
          },
        },
      },
    });
  } catch (e) {
    await InfoBipAxios({
      url: "/whatsapp/1/message/interactive/buttons",
      method: "POST",
      data: {
        from: infobip.phone,
        to: user.phone,
        content: {
          body: {
            text: `⚠️An error occured.${errorParser(e)}\n\nPlease try again.`,
          },
          action: {
            buttons: [
              {
                type: "REPLY",
                id: "/accounts:delete",
                title: "Delete account",
              },
            ],
          },
        },
      },
    });
  }
}

async function handleAccountDeleteCancel(user, message) {
  const metadata = user.metadata;
  user.state = "/menu";
  user.metadata = {
    token: metadata.token,
    userId: metadata.userId,
  };
  await user.save();
  await InfoBipAxios({
    url: "/whatsapp/1/message/interactive/buttons",
    method: "POST",
    data: {
      from: infobip.phone,
      to: user.phone,
      content: {
        body: {
          text: "Account delete cancelled!",
        },
        action: {
          buttons: [
            {
              type: "REPLY",
              id: "/menu",
              title: "View menu",
            },
          ],
        },
      },
    },
  });
}

module.exports = {
  handleAccounts,
  handleAccountAdd,
  handleBankSelect,
  handleAccountAddNumber,
  handleAccountAddCancel,
  handleAccountAddConfirm,
  handleBankOptions,
  handleAccountDelete,
  handleAccountDeleteSelect,
  handleAccountDeleteConfirm,
  handleAccountDeleteCancel,
};
