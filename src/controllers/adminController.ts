import Course from "../models/course.model.js";
import { Request, Response, NextFunction } from "express";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Payment from "../models/payment.model.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { IProfile } from "../types/profile.types.js";
import mongoose from "mongoose";
import CourseProgress from "../models/courseProgress.model.js";

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

export const approveCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "approved", feedback: "" },
      { new: true },
    );
    if (!course) return next(new AppError(404, "Course not found"));
    return sendSuccess(res, 200, "Course approved successfully", { course });
  } catch (error) {
    return next(error);
  }
};

export const rejectCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { feedback } = req.body;

    if (typeof feedback !== "string" || feedback.trim().length === 0) {
      return next(new AppError(400, "Feedback is required to reject a course"));
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", feedback: feedback.trim() },
      { new: true },
    );
    if (!course) return next(new AppError(404, "Course not found"));
    return sendSuccess(res, 200, "Course rejected with feedback", { course });
  } catch (error) {
    return next(error);
  }
};

export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const role = toSafeString(req.query.role);
    const search = toSafeString(req.query.search);
    const status = toSafeString(req.query.status);

    const page = toSafePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = toSafePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const matchQuery: Record<string, unknown> = {};

    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;
    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: escapeRegex(search), $options: "i" } },
        { lastName: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    if (role === "instructor") {
      const users = await User.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: "profiles",
            localField: "additionalInformation",
            foreignField: "_id",
            as: "profile",
          },
        },
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "instructor",
            as: "courses",
          },
        },
        {
          $addFields: {
            coursesCreated: { $size: "$courses" },
            totalStudents: {
              $sum: {
                $map: {
                  input: "$courses",
                  as: "c",
                  in: { $size: { $ifNull: ["$$c.enrolledStudents", []] } },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            role: 1,
            status: 1,
            lastActive: 1,
            createdAt: 1,
            coursesCreated: 1,
            totalStudents: 1,
            profileImage: "$profile.profileImage",
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      const total = await User.countDocuments(matchQuery);
      return sendSuccess(res, 200, "Instructors fetched", {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const [users, total] = await Promise.all([
      User.find(matchQuery)
        .select(
          "firstName lastName email role status lastActive createdAt enrolledCourses additionalInformation",
        )
        .populate<{
          additionalInformation: IProfile;
        }>("additionalInformation", "profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(matchQuery),
    ]);

    const formatted = users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      status: u.status,
      lastActive: u.lastActive,
      createdAt: u.createdAt,
      coursesEnrolled: u.enrolledCourses?.length || 0,
      profileImage: u.additionalInformation?.profileImage || null,
    }));

    return sendSuccess(res, 200, "Users fetched", {
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

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status } = req.body;
    const validStatuses = ["active", "inactive", "suspended"];

    if (!validStatuses.includes(status)) {
      return next(new AppError(400, "Invalid status value"));
    }

    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    if (req.user.id.toString() === req.params.id) {
      return next(new AppError(400, "Admin cannot change their own status"));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).select("firstName lastName email role status lastActive createdAt");

    if (!user) return next(new AppError(404, "User not found"));
    return sendSuccess(res, 200, "User status updated successfully", { user });
  } catch (error) {
    return next(error);
  }
};

export const deleteUserByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    if (req.user.id.toString() === id) {
      return next(new AppError(400, "Admin cannot delete themselves"));
    }

    const user = await User.findById(id);
    if (!user) return next(new AppError(404, "User not found"));

    if (user.role === "instructor") {
      const courseCount = await Course.countDocuments({ instructor: user._id });
      if (courseCount > 0) {
        return next(
          new AppError(
            400,
            `Cannot delete instructor with ${courseCount} active course(s). Reassign or remove their courses first.`,
          ),
        );
      }
    }

    session.startTransaction();

    if (user.additionalInformation) {
      await Profile.findByIdAndDelete(user.additionalInformation, {
        session,
      });
    }

    if (user.enrolledCourses?.length > 0) {
      await Course.updateMany(
        { _id: { $in: user.enrolledCourses } },
        { $pull: { enrolledStudents: user._id } },
        { session },
      );
    }

    await CourseProgress.deleteMany({ user: user._id }, { session });

    await User.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    return sendSuccess(res, 200, "User deleted successfully");
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentYear = new Date().getFullYear();

    const [
      totalRevenue,
      totalStudents,
      totalInstructors,
      totalCourses,
      monthlyRevenue,
      topInstructors,
      courseCategories,
      monthlyStudents,
      monthlyInstructors,
      newEnrollments,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      Course.countDocuments(),
      Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: "$instructor", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "instructor",
          },
        },
        { $unwind: "$instructor" },
        {
          $project: {
            _id: 0,
            instructorId: "$_id",
            name: {
              $concat: ["$instructor.firstName", " ", "$instructor.lastName"],
            },
            earnings: "$total",
          },
        },
      ]),
      Course.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$category.name", "Uncategorized"] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        { $match: { role: "student" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      User.aggregate([
        { $match: { role: "instructor" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "success",
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),
    ]);

    return sendSuccess(res, 200, "Dashboard data fetched", {
      data: {
        stats: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalStudents,
          totalInstructors,
          totalCourses,
        },
        monthlyRevenue,
        monthlyStudents,
        monthlyInstructors,
        topInstructors,
        courseCategories,
        newEnrollments,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rawStatus = toSafeString(req.query.status);
    const status = rawStatus && rawStatus !== "all" ? rawStatus : undefined;

    const dateRange = toSafeString(req.query.dateRange) || "all";

    const page = toSafePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = toSafePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = {};
    if (status) match.status = status;

    const now = new Date();
    let startDate: Date | null = null;
    switch (dateRange) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        break;
    }
    if (startDate) match.createdAt = { $gte: startDate };

    const [transactions, totalCount, statsAgg] = await Promise.all([
      Payment.find(match)
        .populate("user", "firstName lastName")
        .populate("course", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(match),
      Payment.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, "$amount", 0] },
            },
          },
        },
      ]),
    ]);

    return sendSuccess(res, 200, "Transactions fetched", {
      data: {
        stats: { totalRevenue: statsAgg[0]?.totalRevenue || 0 },
        transactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};
