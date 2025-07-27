const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { InfoBipAxios } = require("../../../helpers/webhook/infobip");
const { infobip } = require("../../../config/app");
const { errorParser } = require("../../common/errorParser");
const { cache } = require("../../common/cache");
const { paginate } = require("../../common/paginate");

function getButtons(paginate) {
  if (paginate.hasNextPage && paginate.hasPrevPage) {
    return [
      {
        type: "REPLY",
        id: "/accounts:banks:next",
        title: "Next",
      },
      {
        type: "REPLY",
        id: "/accounts:banks:prev",
        title: "Previous",
      },
    ];
  }

  if (paginate.hasNextPage) {
    return [
      {
        type: "REPLY",
        id: "/accounts:banks:next",
        title: "Next",
      },
    ];
  }

  return [
    {
      type: "REPLY",
      id: "/accounts:banks:prev",
      title: "Previous",
    },
  ];
}

async function getBanks() {
  return BlokAxios({
    url: "/banks",
  }).then((res) => res.data.banks);
}

async function handleAccounts(user, message) {
  try {
    const metadata = JSON.parse(user.metadata);
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
  const metadata = JSON.parse(user.metadata);
  const banks = await cache("banks", getBanks);
  const paginated = paginate(banks, 1, 20);
  const { items, offset, hasPrevPage, hasNextPage } = paginated;
  user.metadata = {
    ...metadata,
    page: 1,
    hasPrevPage,
    hasNextPage,
  };
  user.state = "/accounts:banks:select";
  await user.save();
  const banksString = items
    .map(
      (bank, index) =>
        `${offset === 0 ? index + 1 : offset + index + 1} -  *${bank.name}*`,
    )
    .join("\n");

  const text = `Select the bank you want to add an account to :\n\n${banksString}\n\nReply with next or previous to navigate`;

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
          buttons: getButtons(paginated),
        },
      },
    },
  });
}

async function handleBanksNext(user, message) {
  const metadata = JSON.parse(user.metadata);
  const banks = await cache("banks", getBanks);

  if (metadata.hasNextPage) {
    const paginated = paginate(banks, metadata.page + 1, 20);
    const { items, offset, hasPrevPage, hasNextPage } = paginated;
    const banksString = items
      .map(
        (bank, index) =>
          `${offset === 0 ? index + 1 : offset + index + 1} -  *${bank.name}*`,
      )
      .join("\n");
    const text = `Select the bank you want to add an account to :\n\n${banksString}\n\nReply with next or previous to navigate`;

    user.metadata = {
      ...metadata,
      page: metadata.page + 1,
      hasPrevPage,
      hasNextPage,
    };
    user.state = "/accounts:banks:select";
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
            buttons: getButtons(paginated),
          },
        },
      },
    });
  }
}
async function handleBanksPrev(user, message) {
  const metadata = JSON.parse(user.metadata);
  const banks = await cache("banks", getBanks);

  if (metadata.hasPrevPage) {
    const paginated = paginate(banks, metadata.page - 1, 20);
    const { items, offset, hasPrevPage, hasNextPage } = paginated;
    const banksString = items
      .map(
        (bank, index) =>
          `${offset === 0 ? index + 1 : offset + index + 1} -  *${bank.name}*`,
      )
      .join("\n");
    const text = `Select the bank you want to add an account to :\n\n${banksString}\n\nReply with next or previous to navigate`;

    user.metadata = {
      ...metadata,
      page: metadata.page - 1,
      hasPrevPage,
      hasNextPage,
    };
    user.state = "/accounts:banks:select";
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
            buttons: getButtons(paginated),
          },
        },
      },
    });
  }
}

async function handleBankSelect(user, message) {
  const metadata = JSON.parse(user.metadata);
  const banks = await cache("banks", getBanks);
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
  const metadata = JSON.parse(user.metadata);
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
  const metadata = JSON.parse(user.metadata);

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
  const metadata = JSON.parse(user.metadata);
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
  const metadata = JSON.parse(user.metadata);
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
  const metadata = JSON.parse(user.metadata);

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
  const metadata = JSON.parse(user.metadata);
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
  const metadata = JSON.parse(user.metadata);
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
  handleBanksNext,
  handleBanksPrev,
  handleAccountAddNumber,
  handleAccountAddCancel,
  handleAccountAddConfirm,
  handleAccountDelete,
  handleAccountDeleteSelect,
  handleAccountDeleteConfirm,
  handleAccountDeleteCancel,
};
