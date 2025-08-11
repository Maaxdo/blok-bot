const dotenv = require("dotenv");
const { appRouter } = require("./routes");
const { connectToDB } = require("./db/init");
const cron = require("node-cron");
const { InfoBipAxios } = require("./helpers/webhook/infobip");
const { infobip } = require("./config/app");

dotenv.config();

const PORT = process.env.PORT || 5000;

cron.schedule("* * * * *", async () => {
  await InfoBipAxios({
    url: "/whatsapp/1/message/text",
    method: "POST",
    data: {
      from: infobip.phone,
      to: "2349122981131",
      content: {
        text: "Cron Text",
      },
    },
  });
});

appRouter.listen(PORT, () => {
  connectToDB();
  console.log(`Server running on port ${PORT}`);
});
