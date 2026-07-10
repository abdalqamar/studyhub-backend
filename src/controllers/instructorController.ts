import Course from "../models/courseModal.js";
import User from "../models/userModal.js";
import { IProfile } from "../types/profile.types.js";
import { AppError } from "../utils/AppError.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { sendSuccess } from "../utils/response.js";
import { Request, Response, NextFunction } from "express";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

const toSafeString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toSafePositiveInt = (
  value: unknown,
  fallback: number,
  max?: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  const intVal = Math.floor(parsed);
  return max ? Math.min(intVal, max) : intVal;
};

export const getInstructorUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { id } = req.user;
    const status = toSafeString(req.query.status);
    const search = toSafeString(req.query.search);

    const page = toSafePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = toSafePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const instructorCourses = await Course.find({ instructor: id }, { _id: 1 });
    const courseIds = instructorCourses.map((c) => c._id);

    if (!courseIds.length) {
      return sendSuccess(res, 200, "No students found", {
        users: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        },
      });
    }

    const matchQuery: Record<string, unknown> = {
      role: "student",
      enrolledCourses: { $in: courseIds },
    };

    if (status) matchQuery.status = status;
    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: escapeRegex(search), $options: "i" } },
        { lastName: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(matchQuery)
        .select(
          "firstName lastName email status lastActive createdAt enrolledCourses additionalInformation",
        )
        .populate<{
          additionalInformation: IProfile;
        }>("additionalInformation", "profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(matchQuery),
    ]);

    const formatted = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      createdAt: u.createdAt,
      status: u.status,
      lastActive: u.lastActive,
      coursesEnrolled: u.enrolledCourses?.length || 0,
      profileImage: u.additionalInformation?.profileImage || null,
    }));

    return sendSuccess(res, 200, "Students fetched", {
      users: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};