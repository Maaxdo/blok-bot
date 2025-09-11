const dotenv = require("dotenv");
const { appRouter } = require("./routes");
const { connectToDB } = require("./db/init");
const cron = require("node-cron");
const { User } = require("./db/models");
const { sendInteractiveButtons } = require("./helpers/bot/infobip");
const {
  getCommandExpiry,
  removeCommandExpiry,
} = require("./utils/common/expiry");
dotenv.config();

const PORT = process.env.PORT || 5000;

cron.schedule("* * * * *", async () => {
  const usersWithExpiry = await User.find({
    expiryCommandDatetime: { $exists: true, $ne: null },
    expiryCommand: { $exists: true, $ne: null },
  }).exec();

  for (const user of usersWithExpiry) {
    if (getCommandExpiry(user, user.expiryCommand)) {
      await removeCommandExpiry(user);
      await sendInteractiveButtons({
        user,
        text: `⚠️ Oops! You have been inactive for some time. Please type /menu to view the menu commands`,
        buttons: [
          {
            type: "REPLY",
            id: "/menu",
            title: "Back to menu",
          },
        ],
      });
    }
  }
});

appRouter.listen(PORT, () => {
  connectToDB();
  console.log(`Server running on port ${PORT}`);
});
