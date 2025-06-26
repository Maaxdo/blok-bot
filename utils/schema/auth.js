const { z } = require("zod");
const EmailSchema = z.object({
  email: z.string().email("Invalid email provided"),
});

module.exports = {
  EmailSchema,
};
