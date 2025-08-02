const { z } = require("zod");

const DateSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

module.exports = { DateSchema };
