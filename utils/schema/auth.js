const { z } = require("zod");
const EmailSchema = z.object({
  email: z.string().email("Invalid email provided"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email provided"),
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  EmailSchema,
  LoginSchema,
};
