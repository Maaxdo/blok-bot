const express = require("express");
const { healthRouter } = require("./health");
const { apiV1Url } = require("../config/app");
const { webhookRouter } = require("./webhook");
const appRouter = express();

appRouter.use(express.json());

appRouter.use(
  express.urlencoded({
    extended: false,
  }),
);

appRouter.use(apiV1Url, [healthRouter, webhookRouter]);

module.exports = { appRouter };
