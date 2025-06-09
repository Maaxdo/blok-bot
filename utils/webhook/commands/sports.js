const { sendMessage } = require("../../../helpers/webhook/whatsapp");
const { OddsApiAxios } = require("../../../helpers/webhook/odds-api");
const { ChatMessage, BetSlipItem } = require("../../../db/models");

async function handleViewsports(user) {
  const sports = await OddsApiAxios({
    url: "/sports",
  }).then((res) => res.data);

  const groups = sports.map((sport) => sport.title);

  const message = `
  Select a sport to view available events by sending the corresponding number\n
  ${groups
    .map((group, index) => {
      return `${index + 1}. ${group}`;
    })
    .join("\n")}
  `;
  user.state = "/sports:select";
  await user.save();
  await sendMessage(user.phone, message);
}

async function handleViewEvents(user, message) {
  const sports = await OddsApiAxios({
    url: "/sports",
  }).then((res) => res.data);

  const selectedIndex = Number(message.trim());

  const selectedSport = sports.find((_, index) => index === selectedIndex - 1);

  if (!selectedSport) {
    await sendMessage(
      user.phone,
      "Invalid selection. Please select a valid sport.",
    );
    return;
  }

  const events = await OddsApiAxios({
    url: `/sports/${selectedSport.key}/events`,
  });
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "Africa/Lagos",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });

  const textBody = `
  Select an event to view available odds by sending the corresponding number\n
  ${events.data
    .map((event, index) => {
      const eventDate = new Date(event.commence_time);
      const formattedDate = dateFormatter.format(eventDate);
      const formattedTime = timeFormatter.format(eventDate);

      if (!event.home_team && !event.away_team) {
        return "";
      }

      return `*${index + 1}. ${event.home_team ?? ""} vs ${event.away_team ?? ""}*\n
      Commence date: ${formattedDate}\n
      Commence time: ${formattedTime}
      `;
    })
    .join("\n")}
    
  `;

  user.state = "/sports:select:event";
  await user.save();

  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: message,
    metadata: {
      sport: selectedSport,
      events: events.data,
    },
  });

  await sendMessage(user.phone, textBody);
}

async function handleViewEventOdds(user, message) {
  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/sports:select:event",
    },
    order: [["createdAt", "DESC"]],
  });

  const sport = chatMessage.metadata.sport.key;
  const events = chatMessage.metadata.events;

  const selectedIndex = Number(message.trim());

  const selectedEvent = events.find((_, index) => index === selectedIndex - 1);

  if (!selectedEvent) {
    await sendMessage(
      user.phone,
      "Invalid selection. Please select a valid event.",
    );
    return;
  }

  const odds = await OddsApiAxios({
    url: `/sports/${sport}/events/${selectedEvent.id}/odds?regions=us,uk`,
  });

  const outcomes = odds.data.bookmakers[0].markets[0].outcomes;

  const commenceTime = new Date(odds.data.commence_time);

  const currentDate = new Date();

  if (commenceTime <= currentDate) {
    await sendMessage(
      user.phone,
      "Event has already commenced. Please select another event.",
    );
    return;
  }

  const textBody = `
  ${selectedEvent.home_team} vs ${selectedEvent.away_team}\n
  ${outcomes
    .map((outcome, index) => {
      const name =
        outcome.name.toLowerCase() === "draw" ? "Draw" : `${outcome.name} wins`;
      return `${index + 1}. ${name} - ${outcome.price}`;
    })
    .join("\n")}
  `;
  user.state = "/sports:select:event:odds";
  await user.save();

  await ChatMessage.create({
    userId: user.id,
    state: user.state,
    body: message,
    metadata: {
      game: {
        id: odds.data.id,
        sport_key: odds.data.sport_key,
        sport_title: odds.data.sport_title,
        commence_time: odds.data.commence_time,
        home_team: odds.data.home_team,
        away_team: odds.data.away_team,
        outcomes,
      },
    },
  });
  await sendMessage(user.phone, textBody);
}

async function handleSelectOdd(user, message) {
  const chatMessage = await ChatMessage.findOne({
    where: {
      userId: user.id,
      state: "/sports:select:event:odds",
    },
    order: [["createdAt", "DESC"]],
  });

  if (!chatMessage) {
    await sendMessage(
      user.phone,
      "Invalid selection. Please select a valid odd.",
    );
    return;
  }

  const betslipsCount = await BetSlipItem.count({
    where: {
      userId: user.id,
    },
  });

  if (betslipsCount === 100) {
    await sendMessage(
      user.phone,
      "You can only have a maximum of 100 items in yout bet slip. Please place a bet or clear your bet slip before adding more.",
    );
    return;
  }

  const outcomes = chatMessage.metadata.game.outcomes;

  const outcomeIndex = Number(message.trim());

  if (outcomeIndex < 1 || outcomeIndex > outcomes.length) {
    await sendMessage(
      user.phone,
      "Invalid selection. Please select a valid odd.",
    );
    return;
  }

  const outcome = outcomes[outcomeIndex - 1];

  const existingBetSlip = await BetSlipItem.findOne({
    where: {
      eventId: chatMessage.metadata.game.id,
      userId: user.id,
    },
  });

  if (
    existingBetSlip &&
    outcome.name === existingBetSlip.outcome.name &&
    outcome.price === existingBetSlip.outcome.price
  ) {
    await sendMessage(
      user.phone,
      "You have already added this odd to your bet slip. Please select another odd.",
    );
    return;
  }

  await BetSlipItem.create({
    eventId: chatMessage.metadata.game.id,
    sportKey: chatMessage.metadata.game.sport_key,
    sportTitle: chatMessage.metadata.game.sport_title,
    commenceTime: chatMessage.metadata.game.commence_time,
    homeTeam: chatMessage.metadata.game.home_team,
    awayTeam: chatMessage.metadata.game.away_team,
    outcome,
    userId: user.id,
  });

  user.state = "/sports";
  await user.save();

  const name =
    outcome.name.toLowerCase() === "draw" ? "Draw" : `${outcome.name} wins`;

  await sendMessage(
    user.phone,
    `
    Odd selected: ${name} - ${outcome.price} \n
    Use /bet-slips to view your bet slips\n
    Use /sports to view available sports\n
    `,
  );
}

module.exports = {
  handleViewsports,
  handleViewEvents,
  handleViewEventOdds,
  handleSelectOdd,
};
