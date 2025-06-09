const { WajerAxios } = require("../../../helpers/webhook/wajer");
const { sendMessage } = require("../../../helpers/webhook/whatsapp");
const { ChatMessage } = require("../../../db/models");

function formatHistory(history) {
  return `
 *Here is your bet history:*
 ${history.data.map((bet, index) => {
   return `
 ${index + 1}) Bet ID: #${bet.id}\n
 Date created: ${bet.created_at}\n
 *Items*:\n${bet.metadata.bet_slip_items
   .map((item) => {
     return `
  Event name - ${item.home_team} vs ${item.away_team}\n
  Outcome - ${item.outcome.name === "Draw" ? "Draw" : `${item.outcome.name} wins`}\n
  Price - ${item.outcome.price}\n
  `;
   })
   .join("")}
  Status: ${bet.status}\n
  Amount Staked: ${bet.amount}\n
  Total odds: ${bet.total_odds}\n
  Potential win: ${bet.potential_win}\n
  `;
 })}
   Total bet slips: ${history.meta.total}\n
  ${history.meta.has_previous_page ? "Type *prev* to view previous set of items\n" : ""}
  ${history.meta.has_next_page ? "Type *next* to view next set of items\n" : ""}
 `;
}

async function handleViewBetHistory(user) {
  const history = await WajerAxios({
    url: "/api/bet",
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
  }).then((res) => res.data);

  const textBody = formatHistory(history);

  if (history.meta.has_next_page) {
    user.state = "/history:paginate";
    await user.save();

    await ChatMessage.create({
      userId: user.id,
      message: "",
      state: user.state,
      body: "",
      metadata: {
        page: history.meta.current_page,
      },
    });
  }

  await sendMessage(user.phone, textBody);
}

async function handleHistoryPaginate(user, message) {
  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/history:paginate",
    },
    order: [["createdAt", "DESC"]],
  });

  if (!chatMessage) {
    await sendMessage(user.phone, "Invalid selection.");
    return;
  }
  const action = message.trim().toLowerCase();

  if (action !== "next" && action !== "prev") {
    await sendMessage(user.phone, "Invalid selection.");
    return;
  }

  const page =
    action === "next"
      ? chatMessage.metadata.page + 1
      : chatMessage.metadata.page - 1;

  const history = await WajerAxios({
    url: "/api/bet",
    headers: {
      Authorization: `Bearer ${user.apiKey}`,
    },
    params: {
      page,
    },
  }).then((res) => res.data);

  const textBody = formatHistory(history);

  if (history.meta.has_next_page) {
    user.state = "/history:paginate";
    await user.save();

    await ChatMessage.create({
      userId: user.id,
      message: "",
      state: user.state,
      body: "",
      metadata: {
        page: history.meta.current_page,
      },
    });
  }

  await sendMessage(user.phone, textBody);
}

module.exports = {
  handleViewBetHistory,
  handleHistoryPaginate,
};
