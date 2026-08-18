import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
});

export const rejectCourseSchema = z.object({
  feedback: z.string().min(10).max(1000),
});

export const userQuerySchema = z.object({
  role: z.enum(["student", "instructor", "admin"]).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(12),
});

export const transactionQuerySchema = z.object({
  status: z.enum(["success", "failed", "all"]).optional(),
  dateRange: z
    .enum(["today", "week", "month", "quarter", "all"])
    .default("all"),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(12),
});
