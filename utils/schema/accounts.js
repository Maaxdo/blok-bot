const z = require("zod");

const BankSearchSchema = z.object({
  bank: z
    .string()
    .min(3, "Minimum of 3 characters are required")
    .max(3, "Maximum of 3 characters are allowed"),
});

module.exports = {
  BankSearchSchema,
};
