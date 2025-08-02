const dotenv = require("dotenv");
const { appRouter } = require("./routes");
const { connectToDB } = require("./db/init");

dotenv.config();

const PORT = process.env.PORT || 5000;

appRouter.listen(PORT, () => {
  connectToDB();
  console.log(`Server running on port ${PORT}`);
});
