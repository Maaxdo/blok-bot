const express = require("express");
const { healthCheckerController } = require("../../controllers/health");

const healthRouter = express.Router();

healthRouter.get("/", healthCheckerController);

module.exports = { healthRouter };
