const dotenv = require("dotenv");
const { appRouter } = require("./routes");
const { connectToDB } = require("./db/init");
const cron = require("node-cron");
const { InfoBipAxios } = require("./helpers/webhook/infobip");
const { infobip } = require("./config/app");
const { User } = require("./db/models");
const { sendInteractiveButtons } = require("./helpers/bot/infobip");
const { getCommandExpiry } = require("./utils/common/expiry");

dotenv.config();

const PORT = process.env.PORT || 5000;

appRouter.listen(PORT, () => {
  connectToDB();
  console.log(`Server running on port ${PORT}`);
});

cron.schedule("* * * * *", async () => {
  const usersWithExpiry = await User.find({
    expiryCommandDatetime: { $exists: true, $ne: null },
    expiryCommand: { $exists: true, $ne: null },
  }).exec();

  usersWithExpiry.forEach(async (user) => {
    if (getCommandExpiry(user, user.expiryCommand)) {
      await refreshCommandExpiry(user, user.expiryCommand, 20);
      await sendInteractiveButtons({
        user,
        text: "❌ Oops! You have been inactive for 20 minutes and your previous session has timed out. Please type /menu to view the menu commands",
        buttons: [
          {
            type: "REPLY",
            id: "/menu",
            title: "Back to menu",
          },
        ],
      });
    }
  });
});
