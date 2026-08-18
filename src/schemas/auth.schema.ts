import { z } from "zod";

export const sendOtpSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50)
      .regex(
        /^[a-zA-Z\s\-']+$/,
        "First name can only contain letters, spaces, hyphens and apostrophes",
      ),
    lastName: z
      .string()
      .max(50)
      .regex(/^[a-zA-Z\s\-']+$/)
      .optional()
      .or(z.literal("")),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain at least one uppercase letter, one number, and one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerSchema = z.object({
  email: z.string().email({}),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const loginSchema = z.object({
  email: z.string().email({}),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({}),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(6)
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    confirmNewPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6)
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
