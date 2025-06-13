const { z } = require("zod");

const WalletPinSchema = z.object({
  pin: z.string().regex(/^[0-9]{4}$/, {
    message: "Pin must be 4 digits",
  }),
});

module.exports = {
  WalletPinSchema,
};
