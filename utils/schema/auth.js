const { z } = require("zod");
const EmailSchema = z.object({
  email: z.string().email("Invalid email provided"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email provided"),
  password: z.string().min(1, "Password is required"),
});

const RegisterSchema = z
  .object({
    email: z.string().email("Invalid email provided"),
    password: z.string().min(1, "Password is required"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

module.exports = {
  EmailSchema,
  LoginSchema,
  RegisterSchema,
};
