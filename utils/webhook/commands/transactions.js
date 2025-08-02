const { sendFlow } = require("../../../helpers/bot/infobip");
const { DateSchema } = require("../../schema/transactions");
const { zodErrorParser } = require("../../common/errorParser");
const { BlokAxios } = require("../../../helpers/webhook/blokbot");

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

  const res = await BlokAxios({
    url: `/transactions/${metadata.userId}`,
    params: {
      start_date: message.startDate,
      end_date: message.endDate,
    },
  }).then((res) => res.data);

  console.log(res);
}

module.exports = { handleTransactions, handleTransactionsDate };
