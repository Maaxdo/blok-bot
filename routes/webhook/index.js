const express = require("express");
const {
  handlePostWebhook,
  handleGetWebhook,
  saveUser,
} = require("../../controllers/webhook");
const {
  handleFintavaWebhook,
  handleFintavaTestWebhook,
} = require("../../controllers/webhook/fintava");

const webhookRouter = express.Router();

webhookRouter.get("/webhook", handleGetWebhook);
webhookRouter.post("/webhook", saveUser, handlePostWebhook);
webhookRouter.post("/webhook/fintava", handleFintavaWebhook);
webhookRouter.post("/webhook/fintava/test", handleFintavaTestWebhook);

module.exports = { webhookRouter };
