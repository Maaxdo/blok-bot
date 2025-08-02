const mongoose = require("mongoose");
require("dotenv").config();

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Mongoose connected to MongoDB");
  } catch (error) {
    console.error("Error closing Mongoose connection:", error);
  }
}

module.exports = { connectToDB };
