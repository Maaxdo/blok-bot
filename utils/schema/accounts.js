const z = require("zod");

const BankSearchSchema = z.object(
  {
    bank: z
      .string()
      .min(3, "Minimum of 3 characters are required")
      .max(3, "Maximum of 3 characters are allowed"),
  },
  {
    invalid_type_error: "Invalid bank name provided",
    required_error: "Bank name is required",
  },
);

module.exports = {
  BankSearchSchema,
};
