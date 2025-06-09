const dotenv = require("dotenv");
const { appRouter } = require("./routes");

dotenv.config();

const PORT = process.env.PORT || 5000;

appRouter.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
