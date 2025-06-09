const { IncomingWebhook } = require("@slack/webhook");
const { errorParser } = require("./errorParser");
require("dotenv").config();

const url = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(url);

async function logErrorToSlack(err) {
  try {
    const error = errorParser(err);
    await webhook.send({
      text: `:rotating_light: Error: ${error} \n ${err.stack}`,
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  logErrorToSlack,
};
