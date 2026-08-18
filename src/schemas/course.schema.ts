import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  whatYouWillLearn: z.array(z.string().min(1)).min(1).max(20),
  requirements: z.array(z.string().min(1)).max(10).optional(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID"),
  price: z.coerce.number().min(0).max(100000).default(0),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();
export const courseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(12),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
