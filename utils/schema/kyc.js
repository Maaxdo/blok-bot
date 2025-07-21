const { z } = require("zod");

const KycSchema = z.object({
  bvn: z.string().regex(/^[0-9]{11}$/, {
    message: "BVN must be 11 digits",
  }),
});

module.exports = {
  KycSchema,
};
