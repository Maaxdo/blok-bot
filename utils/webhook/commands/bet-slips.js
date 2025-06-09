const { Op } = require("sequelize");
const { BetSlipItem, ChatMessage } = require("../../../db/models");
const { WajerAxios } = require("../../../helpers/webhook/wajer");
const {
  sendMessage,
  sendInteractiveMessage,
} = require("../../../helpers/webhook/whatsapp");
const { errorParser } = require("../../common/errorParser");

async function handleViewBetSlip(user) {
  const betSlips = await BetSlipItem.findAll({
    where: {
      userId: user.id,
      commenceTime: {
        [Op.gte]: new Date(),
      },
    },
  });

  if (!betSlips.length) {
    await sendMessage(user.phone, "You have no item(s) saved in your bet slip");
    return;
  }

  const odds = betSlips.map((betSlip) => betSlip.outcome.price);
  const totalOdds = odds.reduce((acc, odd) => acc * odd, 1);

  const interactiveMessage = {
    type: "list",
    header: {
      type: "text",
      text: "Your bet slip",
    },
    body: {
      text: `${betSlips
        .map((betSlip, index) => {
          const name =
            betSlip.outcome.name.toLowerCase() === "draw"
              ? "Draw"
              : `${betSlip.outcome.name} wins`;
          return `${index + 1}. ${name} - ${betSlip.outcome.price}`;
        })
        .join("\n")}\n*Total odds*: ${totalOdds.toFixed(2)}`,
    },
    action: {
      button: "Select an action",
      sections: [
        {
          title: "Actions",
          rows: [
            {
              id: "/bet-slips:clear",
              title: "Clear bet slip",
            },
            {
              id: "/bet-slips:place-bet",
              title: "Place bet",
            },
          ],
        },
      ],
    },
  };

  await sendInteractiveMessage(user.phone, interactiveMessage);
  // await sendMessage(user.phone, textBody);
}

async function handleClearBetSlip(user) {
  await BetSlipItem.destroy({
    where: {
      userId: user.id,
    },
  });

  const textBody = `Bet slip has been cleared`;

  await sendMessage(user.phone, textBody);
}

async function handlePlaceBetPrompt(user) {
  const textBody = "How much (₦) do you want to bet with";
  user.state = "/bet-slips:place-bet:amount";
  await user.save();

  await sendMessage(user.phone, textBody);
}

async function handlePlaceBetAmount(user, message) {
  const amount = Number(message.trim());

  if (isNaN(amount)) {
    await sendMessage(user.phone, "Invalid amount entered");
    return;
  }

  const betSlips = await BetSlipItem.findAll({
    where: {
      userId: user.id,
      commenceTime: {
        [Op.gte]: new Date(),
      },
    },
  });
  const odds = betSlips.map((betSlip) => betSlip.outcome.price);
  const totalOdds = odds.reduce((acc, odd) => acc * odd, 1);

  const stakingAmount = amount.toLocaleString();
  const potentialWinnings = (amount * totalOdds).toLocaleString();

  const textBody = `
  Staking amount - ₦${stakingAmount}\n
  Total odds amount - ${totalOdds.toFixed(2)}\n
  potential winnings - ₦${potentialWinnings}\n
  Enter "yes" to confirm bet placement or "no" to cancel
  `;
  user.state = "/bet-slips:place-bet:confirm";
  await user.save();
  await ChatMessage.create({
    userId: user.id,
    message,
    state: user.state,
    body: amount,
    metadata: {
      amount,
    },
  });

  await sendMessage(user.phone, textBody);
}

async function handleConfirmBet(user, message) {
  const option = message.trim().toLowerCase();

  if (option !== "yes") {
    user.state = null;
    await user.save();
    await sendMessage(user.phone, "Bet process cancelled");
    return;
  }

  try {
    const betSlips = await BetSlipItem.findAll({
      where: {
        userId: user.id,
        commenceTime: {
          [Op.gte]: new Date(),
        },
      },
    });

    const chatMessage = await ChatMessage.findOne({
      where: {
        userId: user.id,
        state: "/bet-slips:place-bet:confirm",
      },
      order: [["createdAt", "DESC"]],
    });

    const amount = chatMessage.metadata.amount;

    const data = {
      bet_slip_items: betSlips.map((betSlip) => ({
        id: betSlip.eventId,
        sport_key: betSlip.sportKey,
        sport_title: betSlip.sportTitle,
        commence_time: betSlip.commenceTime,
        home_team: betSlip.homeTeam,
        away_team: betSlip.awayTeam,
        outcome: betSlip.outcome,
      })),
      amount,
    };

    await WajerAxios({
      url: "/api/bet",
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.apiKey}`,
      },
      data,
    }).then((res) => res.data);

    await BetSlipItem.destroy({
      where: {
        userId: user.id,
      },
    });
    user.state = null;
    await user.save();
    await sendMessage(user.phone, "Bet placed successfully");
  } catch (err) {
    await sendMessage(user.phone, errorParser(err));
  }
}

module.exports = {
  handleViewBetSlip,
  handleClearBetSlip,
  handlePlaceBetPrompt,
  handlePlaceBetAmount,
  handleConfirmBet,
};
