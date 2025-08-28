const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json(),
  ),
  transports: [
    // Logs all requests and info level messages
    new winston.transports.File({ filename: "logs/combined.log" }),
    // Logs only errors
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ],
});

module.exports = {
  logger,
};
