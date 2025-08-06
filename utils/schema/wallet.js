const { z } = require("zod");

const WalletPinSchema = z
  .object({
    pin: z.string().regex(/^[0-9]{4}$/, {
      message: "Pin must be 4 digits",
    }),
    confirmPin: z.string(),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "Pin does not match",
    path: ["confirmPin"],
  });

const DepositSchema = z.object({
  wallet: z.enum(["USDT", "SOL", "BTC", "ETH", "BNB"]),
});

const WalletSchema = z.object({
  wallet: z.enum(["USDT", "SOL", "BTC", "ETH", "BNB"]),
});

const WithdrawSchema = z.object({
  amount: z.string().regex(/^[0-9]+(\.[0-9]+)?$/, {
    message: "Amount must be a valid number",
  }),
  pin: z.string().min(1, "Pin is required"),
  address: z.string().min(1, "Address is required"),
});

const BuySchema = z.object({
  amount: z.string().regex(/^[0-9]+(\.[0-9]+)?$/, {
    message: "Amount must be a valid number",
  }),
  pin: z.string().min(1, "Pin is required"),
});

module.exports = {
  WalletPinSchema,
  DepositSchema,
  WithdrawSchema,
  BuySchema,
  WalletSchema,
};
