const {
  sendFlow,
  sendInteractiveButtons,
  sendText,
} = require("../../../helpers/bot/infobip");
const { DateSchema } = require("../../schema/transactions");
const { zodErrorParser, errorParser } = require("../../common/errorParser");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");
const { paginateExternally } = require("../../common/paginate");
const { getPaginationButtons } = require("../../common/pagination");

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
  await user.save();
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
    };
    await user.save();
    const res = await BlokAxios({
      url: `/transactions/${metadata.userId}`,
      params: {
        start_date: message.startDate,
        end_date: message.endDate,
        limit: 10,
      },
    }).then((res) => res.data);
    const paginate = paginateExternally(res.total, res.page, res.limit);
    const buttons = getPaginationButtons(paginate, "transactions");
    const transactions = res.transactions
      .map((item) => {
        const createdAt = new Date(item.createdAt).toLocaleString();
        const amount = `*${item.currency} ${item.amount}*`;
        const status = item.status.toUpperCase().replaceAll("_", " ");
        const type = item.transaction_type.toUpperCase();
        return `Transaction type: *${type}*\nAmount: ${amount}\nStatus: *${status}*\nCreated at: *${createdAt}*\n`;
      })
      .join("\n\n");

    await sendInteractiveButtons({
      user,
      text: transactions,
      buttons,
    });
  } catch (e) {
    await sendText({ user, text: errorParser(e) });
  }
}

module.exports = { handleTransactions, handleTransactionsDate };
