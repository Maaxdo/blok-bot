const { logger } = require("../../utils/common/logger");

async function handleFintavaWebhook(req, res) {
  logger.log("info", "Received Fintava webhook", { body: req.body });
  return res.status(200).send("EVENT_RECEIVED");
}

async function handleFintavaTestWebhook(req, res) {
  logger.log("info", "Received Fintava webhook", { body: req.body });
  return res.status(200).send("EVENT_RECEIVED");
}

module.exports = {
  handleFintavaTestWebhook,
  handleFintavaWebhook,
};
