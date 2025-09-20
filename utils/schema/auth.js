const { z } = require("zod");
const EmailSchema = z.object(
  {
    email: z.string().email("Invalid email provided"),
  },
  {
    required_error: "Email is required",
    invalid_type_error: "Invalid email provided",
  },
);

const LoginSchema = z.object(
  {
    email: z.string().email("Invalid email provided"),
    password: z.string().min(1, "Password is required"),
  },
  {
    message: "Invalid email or password",
  },
);

const RegisterSchema = z
  .object(
    {
      email: z.string().email("Invalid email provided"),
      password: z.string().min(1, "Password is required"),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      confirmPassword: z.string(),
      dob: z.string().min(1, "Date of birth is required"),
    },
    {
      message: "Invalid registration information",
    },
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPasswordSchema = z
  .object(
    {
      password: z.string().min(1, "Password is required"),
      confirmPassword: z.string(),
      resetCode: z.string().min(1, "Reset code is required"),
    },
    {
      invalid_type_error: "Invalid information provided",
      required_error: "Invalid information provided",
    },
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

module.exports = {
  EmailSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
};
