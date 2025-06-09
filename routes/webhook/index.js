const express = require("express");
const {
  handlePostWebhook,
  handleGetWebhook,
  saveUser,
} = require("../../controllers/webhook");

const webhookRouter = express.Router();

webhookRouter.get("/webhook", handleGetWebhook);
webhookRouter.post("/webhook", saveUser, handlePostWebhook);

module.exports = { webhookRouter };
