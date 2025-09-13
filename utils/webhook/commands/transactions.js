const {
  sendFlow,
  sendInteractiveButtons,
} = require("../../../helpers/bot/infobip");
const { DateSchema } = require("../../schema/transactions");
const { zodErrorParser, errorParser } = require("../../common/errorParser");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { paginateExternally } = require("../../common/paginate");
const { getPaginationButtons } = require("../../common/pagination");
const {
  refreshCommandExpiry,
  removeCommandExpiry,
} = require("../../common/expiry");
const { logger } = require("../../common/logger");

const datesFlow = {
  mode: "PUBLISHED",
  flowMessageVersion: 3,
  flowToken: "Flow token",
  flowId: "1325055105998685",
  callToActionButton: "Continue",
  flowAction: "NAVIGATE",
  flowActionPayload: {
    screen: "TRANSACTIONS",
  },
};

async function handleTransactions(user, message) {
  await sendFlow({
    user,
    action: datesFlow,
    text: "Select date range to view your transactions",
  });
  user.state = "/transactions:dates";
  user.rememberedState = "/transactions";

  await user.save();
  await refreshCommandExpiry(user, "/transactions", 20);
}

function getTransactionsText(transactions) {
  return transactions
    .map((item) => {
      const createdAt = new Date(item.created_at).toLocaleString();
      const amount = `*${item.currency} ${item.amount}*`;
      const status = item.status.toUpperCase().replaceAll("_", " ");
      const type = item.transaction_type.toUpperCase();
      return `Transaction type: *${type}*\nAmount: ${amount}\nStatus: *${status}*\nCreated at: *${createdAt}*\n`;
    })
    .join("\n\n");
}

async function handleTransactionsDate(user, message) {
  const validation = DateSchema.safeParse(message);
  const metadata = user.metadata;

  if (!validation.success) {
    await sendFlow({
      user,
      text: `Invalid date provided:\n${zodErrorParser(validation)}`,
      action: datesFlow,
    });
    return;
  }

  try {
    user.metadata = {
      ...metadata,
      ...message,
      page: 1,
    };
    await user.save();
    const res = await BlokAxios({
      url: `/transactions/${metadata.userId}`,
      params: {
        start_date: message.startDate,
        end_date: message.endDate,
        limit: 5,
      },
    }).then((res) => res.data);
    const paginate = paginateExternally(res.total, res.page, res.limit);
    const buttons = getPaginationButtons(paginate, "/transactions");

    if (res.transactions.length === 0) {
      await sendInteractiveButtons({
        user,
        text: `You have no transactions from ${message.startDate} to ${message.endDate}`,
        buttons: [
          {
            id: "/transactions",
            type: "REPLY",
            title: "Try again",
          },
        ],
      });
      return;
    }

    const text = getTransactionsText(res.transactions);

    await sendInteractiveButtons({
      user,
      text,
      buttons,
    });
  } catch (e) {
    logger.error(errorParser(e), e);
    user.state = "/transactions";
    await user.save();
    await sendInteractiveButtons({
      user,
      text: errorParser(e),
      buttons: [
        {
          type: "REPLY",
          id: "/transactions",
          title: "Try again",
        },
      ],
    });
  }
}

async function handleTransactionsNext(user, message) {
  const metadata = user.metadata;
  const page = metadata.page + 1;

  try {
    user.metadata = {
      ...metadata,
      page,
    };
    await user.save();

    const res = await BlokAxios({
      url: `/transactions/${metadata.userId}`,
      params: {
        start_date: metadata.startDate,
        end_date: metadata.endDate,
        limit: 5,
        page,
      },
    }).then((res) => res.data);
    const paginate = paginateExternally(res.total, res.page, res.limit);
    const buttons = getPaginationButtons(paginate, "/transactions");

    await sendInteractiveButtons({
      user,
      text: getTransactionsText(res.transactions),
      buttons,
    });
    await removeCommandExpiry(user);
  } catch (e) {
    user.state = "/transactions";
    await user.save();
    await sendInteractiveButtons({
      user,
      text: errorParser(e),
      buttons: [
        {
          type: "REPLY",
          id: "/transactions",
          title: "Try again",
        },
      ],
    });
  }
}

async function handleTransactionsPrev(user, message) {
  const metadata = user.metadata;
  const page = metadata.page - 1;

  try {
    user.metadata = {
      ...metadata,
      page,
    };
    await user.save();

    const res = await BlokAxios({
      url: `/transactions/${metadata.userId}`,
      params: {
        start_date: metadata.startDate,
        end_date: metadata.endDate,
        limit: 5,
        page,
      },
    }).then((res) => res.data);
    const paginate = paginateExternally(res.total, res.page, res.limit);
    const buttons = getPaginationButtons(paginate, "/transactions");

    await sendInteractiveButtons({
      user,
      text: getTransactionsText(res.transactions),
      buttons,
    });
    await removeCommandExpiry(user);
  } catch (e) {
    user.state = "/transactions";
    await user.save();
    await sendInteractiveButtons({
      user,
      text: errorParser(e),
      buttons: [
        {
          type: "REPLY",
          id: "/transactions",
          title: "Try again",
        },
      ],
    });
  }
}

module.exports = {
  handleTransactions,
  handleTransactionsDate,
  handleTransactionsNext,
  handleTransactionsPrev,
};
