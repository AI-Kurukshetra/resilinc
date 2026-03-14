import { z } from "zod";

const EmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .max(320, "Email is too long")
  .transform((value) => value.toLowerCase());

const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or less");

const NextPathSchema = z.string().trim().optional();

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
  next: NextPathSchema,
});

export const SignupRequestSchema = z
  .object({
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
    next: NextPathSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ResetPasswordRequestSchema = z.object({
  email: EmailSchema,
});

export const UpdatePasswordRequestSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;
