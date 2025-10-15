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
        // text: `✅ *Buy complete*\n${body.transaction.amount} ${body.transaction.currency} has been sent to your wallet`,
      });
      return res.status(200).send("EVENT_RECEIVED");
    }

    if (body.event === "sell_success") {
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

    if (body.event === "customer_bank_transfer") {
    }
    return res.status(200).send("EVENT_RECEIVED: Invalid event");
  } catch (err) {
    logger.error("Webhook Error", err);
    return res.status(500).json({ error: "Webhook Error", details: err });
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
