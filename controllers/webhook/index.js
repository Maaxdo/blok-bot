const { commands } = require("../../utils/webhook/commands");
const { extractMessage } = require("../../utils/webhook/extractMessage");
const { User } = require("../../db/models");
const { handleSupport } = require("../../utils/webhook/commands/support");

function handleGetWebhook(req, res) {
  const challenge = req.query["hub.challenge"];
  return res.status(200).send(challenge);
}

async function saveUser(req, res, next) {
  // Disallow any other event apart from message events
  if (!req.body.results) {
    return res.status(200).send("EVENT RECEIVED: No body");
  }

  try {
    const phone = req.body.results[0].sender;

    const user = await User.findOne({
      phone,
    });

    if (user) {
      req.user = user;
      return next();
    }

    req.user = await new User({
      phone,
      state: "/start",
    }).save();
    return next();
  } catch (err) {
    console.log(err);
    return res.status(200).send("ERROR");
  }
}

async function handlePostWebhook(req, res) {
  try {
    const user = req.user;
    const message = extractMessage(req.body);

    let command =
      typeof message === "string"
        ? commands.find(
            (cmd) =>
              cmd.command === message ||
              cmd.command === `/${message.trim().toLowerCase()}`,
          )
        : null;

    if (!command && typeof message === "string") {
      command = commands.find(
        (cmd) =>
          cmd.nplMessage &&
          message.toLowerCase().includes(cmd.nplMessage?.toLowerCase()),
      );
    }

    if (command) {
      await command.function(user, message);
      return res.status(200).send("EVENT_RECEIVED: Command");
    }

    const state = user.state;
    const commandState = commands.find((cmd) => cmd.command === state);
    if (commandState) {
      await commandState.function(user, message);
      return res.status(200).send("EVENT_RECEIVED: State");
    }
    await handleSupport(user, message);

    return res.status(200).send("EVENT_RECEIVED: Menu");
  } catch (err) {
    if ("response" in err) {
      console.log(JSON.stringify(err.response.data));
    } else {
      console.log(err);
    }
    return res.status(200).send("ERROR");
  }
}

module.exports = {
  handleGetWebhook,
  handlePostWebhook,
  saveUser,
};
