const { logger } = require("../../utils/common/logger");
const { User } = require("../../db/models");
const { sendText } = require("../../helpers/bot/infobip");

async function handleFintavaWebhook(req, res) {
  const body = req.body;

  try {
    if (body.event === "buy_success") {
      const user = await User.findOne({
        "metadata.userId": body.user_id,
      });
      if (!user) {
        return res.status(404).send("User not found");
      }

      await sendText({
        user,
        text: `✅ ${body.message}`,
      });
      return res.status(200).send("EVENT_RECEIVED");
    }
    return res.status(200).send("EVENT_RECEIVED: Invalid event");
  } catch (err) {
    logger.error("Fintava Webhook Error", err);
  }
}

async function handleFintavaTestWebhook(req, res) {
  logger.log("info", "Received Fintava webhook", { body: req.body });
  return res.status(200).send("EVENT_RECEIVED");
}

module.exports = {
  handleFintavaTestWebhook,
  handleFintavaWebhook,
};
