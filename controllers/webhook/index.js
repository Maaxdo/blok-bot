const { User } = require("../../db/models");
const { commands } = require("../../utils/webhook/commands");
const { extractMessage } = require("../../utils/webhook/extractMessage");
const { logErrorToSlack } = require("../../utils/common/slack");

function handleGetWebhook(req, res) {
  const challenge = req.query["hub.challenge"];
  return res.status(200).send(challenge);
}

async function saveUser(req, res, next) {
  // Disallow any other event apart from message events
  if (!req.body.entry[0].changes[0].value.messages) {
    return res.status(200).send("EVENT RECIEVED");
  }

  try {
    const phone = req.body.entry[0].changes[0].value.messages[0].from;

    const user = await User.findOne({
      where: {
        phone,
      },
    });

    if (user) {
      req.user = user;
      return next();
    }

    const newUser = await User.create({
      phone,
      state: "/start",
    });
    req.user = newUser;
    return next();
  } catch (err) {
    logErrorToSlack(err);
    return res.status(200).send("ERROR");
  }
}

async function handlePostWebhook(req, res) {
  try {
    const user = req.user;
    const message = extractMessage(
      req.body.entry[0].changes[0].value.messages[0],
    );

    const command = commands.find((cmd) => cmd.command === message);
    if (command) {
      await command.function(user, message);
      return res.status(200).send("EVENT_RECEIVED");
    }

    const state = user.state;
    const commandState = commands.find((cmd) => cmd.command === state);
    if (commandState) {
      await commandState.function(user, message);
      return res.status(200).send("EVENT_RECEIVED");
    }

    return res.status(200).send("EVENT_RECEIVED");
  } catch (err) {
    await logErrorToSlack(err);
    return res.status(200).send("ERROR");
  }
}

module.exports = {
  handleGetWebhook,
  handlePostWebhook,
  saveUser,
};
