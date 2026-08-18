import User from "../models/user.model.js";
import CourseProgress from "../models/courseProgress.model.js";
import { sendSuccess } from "../utils/response.js";
import * as profileService from "../services/profileService.js";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { IProfile } from "../types/profile.types.js";
import { ICourseProgress } from "../types/courseProgress.types.js";
import mongoose from "mongoose";

type PopulatedLesson = {
  _id: mongoose.Types.ObjectId;
  title: string;
  duration: number;
};

type PopulatedSection = {
  lesson: PopulatedLesson[];
};

type PopulatedCourse = {
  _id: mongoose.Types.ObjectId;
  title: string;
  thumbnail: string;
  description: string;
  courseContent: PopulatedSection[];
  instructor: { firstName: string; lastName: string };
  category: { name: string };
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const user = await profileService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, 200, "Profile updated successfully", { user });
  } catch (error) {
    return next(error);
  }
};

export const updateProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    const imageFile = files?.profileImage?.[0] || null;

    const profile = await profileService.updateProfileImage(
      req.user.id,
      imageFile,
    );
    return sendSuccess(res, 200, "Profile image updated successfully", {
      profile,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const user = await User.findById(req.user.id)
      .populate<{ additionalInformation: IProfile }>("additionalInformation")
      .select("firstName lastName email role lastActive additionalInformation")
      .lean();

    if (!user) return next(new AppError(404, "User not found"));

    return sendSuccess(res, 200, "User details fetched successfully", {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        lastActive: user.lastActive,
        gender: user.additionalInformation?.gender || null,
        contactNumber: user.additionalInformation?.contactNumber || null,
        about: user.additionalInformation?.about || null,
        profileImage: user.additionalInformation?.profileImage || null,
        dateOfBirth: user.additionalInformation?.dateOfBirth || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getEnrolledCourses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const userId = req.user.id;

    const user = await User.findById(userId)

      .select("enrolledCourses")
      .populate({
        path: "enrolledCourses",
        populate: [
          {
            path: "courseContent",
            populate: { path: "lesson", select: "title duration" },
          },
          { path: "instructor", select: "firstName lastName" },
          { path: "category", select: "name" },
        ],
      })
      .lean();

    if (!user) return next(new AppError(404, "User not found"));

    const enrolledCourses =
      (user.enrolledCourses as unknown as PopulatedCourse[]) || [];

    const courseIds = enrolledCourses.map((c) => c._id);

    const allProgress = await CourseProgress.find({
      userId,
      courseId: { $in: courseIds },
    }).lean();

    const progressMap: Record<string, ICourseProgress> = {};
    allProgress.forEach((p) => {
      progressMap[p.courseId.toString()] = p;
    });

    const courses = enrolledCourses.map((course) => {
      const lessons = (course.courseContent || []).flatMap(
        (s) => s.lesson || [],
      );
      const totalLessons = lessons.length;
      const totalMinutes = lessons.reduce(
        (sum, l) => sum + (l.duration || 0),
        0,
      );
      const progress = progressMap[course._id.toString()];
      const completed = progress?.completedVideos?.length || 0;

      return {
        _id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        description: course.description,
        progressPercentage: totalLessons
          ? Math.round((completed / totalLessons) * 100)
          : 0,
        totalDuration: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
        totalLessons,
        category: course.category?.name || null,
        instructor:
          `${course.instructor?.firstName || ""} ${course.instructor?.lastName || ""}`.trim(),
      };
    });

    return sendSuccess(res, 200, "Enrolled courses fetched", { courses });
  } catch (error) {
    return next(error);
  }
};
