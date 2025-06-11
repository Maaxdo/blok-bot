const { User } = require("../../db/models");
const { commands } = require("../../utils/webhook/commands");
const { extractMessage } = require("../../utils/webhook/extractMessage");

function handleGetWebhook(req, res) {
  const challenge = req.query["hub.challenge"];
  return res.status(200).send(challenge);
}

async function saveUser(req, res, next) {
  // Disallow any other event apart from message events
  if (!req.body.Body) {
    return res.status(200).send("EVENT RECIEVED: No body");
  }

  try {
    const phone = req.body.WaId;

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
    return res.status(200).send("ERROR");
  }
}

async function handlePostWebhook(req, res) {
  try {
    const user = req.user;
    const message = extractMessage(req.body);

    const command = commands.find(
      (cmd) => cmd.command === message || cmd.command === `/${message}`,
    );
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
    console.log(err);
    return res.status(200).send("ERROR");
  }
}

module.exports = {
  handleGetWebhook,
  handlePostWebhook,
  saveUser,
};
