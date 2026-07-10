import Course from "../models/courseModal.js";
import CourseProgress from "../models/courseProgressModal.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { calculateLessonStats } from "../utils/calculateLessonStats.js";
import { sendSuccess } from "../utils/response.js";
import * as courseService from "../services/courseService.js";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { ILesson } from "../types/lesson.types.js";
import { PopulatedRating } from "../types/rating.types.js";
import mongoose from "mongoose";

type PopulatedSection = {
  _id: mongoose.Types.ObjectId;
  sectionName: string;
  lesson: (ILesson & { _id: mongoose.Types.ObjectId })[];
};

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

//  Create
export const createCourse = async (
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
    const thumbnailFile = files?.courseThumbnail?.[0];

    if (!thumbnailFile) {
      return next(new AppError(400, "Thumbnail image is required"));
    }

    const course = await courseService.createCourse(
      req.body,
      thumbnailFile,
      req.user.id,
    );
    return sendSuccess(res, 201, "Course created successfully", { course });
  } catch (error) {
    return next(error);
  }
};

//  Delete
export const deleteCourse = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    await courseService.deleteCourse(req.params.id as string, req.user);
    return sendSuccess(res, 200, "Course deleted successfully");
  } catch (error) {
    return next(error);
  }
};

//  Update
export const updateCourse = async (
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
    const thumbnailFile = files?.courseThumbnail?.[0] || null;

    const course = await courseService.updateCourse(
      req.params.id as string,
      req.user,
      req.body,
      thumbnailFile,
    );
    return sendSuccess(res, 200, "Course updated successfully", { course });
  } catch (error) {
    return next(error);
  }
};

//  Get single (edit view — instructor)
export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const course = await courseService.getCourseById(req.params.id as string);
    return sendSuccess(res, 200, "Course details fetched", { course });
  } catch (error) {
    return next(error);
  }
};

// Public course listing (no auth required)
export const getPublicCourses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const search = toSafeString(req.query.search);
    const category = toSafeString(req.query.category);

    const page = toSafePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = toSafePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);

    const skip = (page - 1) * limit;

    const matchQuery: Record<string, unknown> = {
      status: "approved",
    };

    if (category) matchQuery.category = category;
    if (search) matchQuery.$text = { $search: search };

    const [courses, total] = await Promise.all([
      Course.find(matchQuery)
        .populate("category", "name")
        .populate("instructor", "firstName lastName")
        .select(
          "-courseContent -ratingAndReviews -requirements -tags -enrolledStudents",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(matchQuery),
    ]);

    const formattedCourses = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      thumbnail: c.thumbnail,
      price: c.price,
      averageRating: c.averageRating || 0,
      enrolledStudents: c.totalStudentsCount || 0,
      category: c.category || null,
      instructor: c.instructor || null,
      totalLectures: c.totalLessons || 0,
      totalDuration: c.totalDuration || "0h 0m",
    }));

    return sendSuccess(res, 200, "Courses fetched", {
      courses: formattedCourses,
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

// Manage (admin + instructor dashboard)
export const fetchAllCourses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { role, id: userId } = req.user;

    if (role !== "admin" && role !== "instructor") {
      return next(new AppError(403, "Unauthorized"));
    }

    const instructor = toSafeString(req.query.instructor);
    const status = toSafeString(req.query.status);
    const category = toSafeString(req.query.category);
    const search = toSafeString(req.query.search);

    const page = toSafePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = toSafePositiveInt(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);

    const skip = (page - 1) * limit;

    const matchQuery: Record<string, unknown> = {};

    if (status) matchQuery.status = status;
    if (category) matchQuery.category = category;
    if (search)
      matchQuery.title = { $regex: escapeRegex(search), $options: "i" };

    if (role === "instructor") {
      matchQuery.instructor = userId;
    } else if (role === "admin" && instructor && instructor !== "me") {
      matchQuery.instructor = instructor;
    }

    const [courses, total] = await Promise.all([
      Course.find(matchQuery)
        .populate("category", "name")
        .populate(
          "instructor",
          role === "admin" ? "firstName lastName email" : "firstName lastName",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(matchQuery),
    ]);

    const formatted = courses.map((course) => ({
      _id: course._id,
      title: course.title,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      thumbnail: course.thumbnail,
      price: course.price,
      category: course.category || null,
      instructor: course.instructor || null,
      enrolledCount: course.totalStudentsCount || 0,
      averageRating: course.averageRating || 0,
      duration: course.totalDuration || "0h 0m",
      feedback: course.feedback || "",
    }));

    return sendSuccess(res, 200, "Courses fetched", {
      courses: formatted,
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

// Course details (public)
export const getCourseDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("category", "name")
      .populate({
        path: "instructor",
        select: "firstName lastName",
        populate: {
          path: "additionalInformation",
          select: "about profileImage",
        },
      })
      .populate({
        path: "courseContent",
        populate: { path: "lesson", select: "title description duration" },
      })
      .populate({
        path: "ratingAndReviews",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "user",
          select: "firstName lastName email additionalInformation",
          populate: { path: "additionalInformation", select: "profileImage" },
        },
      })
      .lean();

    if (!course) return next(new AppError(404, "Course not found"));
    if (course.status !== "approved") {
      return next(new AppError(404, "Course not found"));
    }

    const courseContent = (course.courseContent ||
      []) as unknown as PopulatedSection[];

    const lessons = courseContent.flatMap((s) => s.lesson || []);

    const { hours, minutes } = calculateLessonStats(lessons);

    const ratingAndReviews = (course.ratingAndReviews ||
      []) as unknown as PopulatedRating[];

    const formattedReviews = ratingAndReviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt,
      user: {
        profileImage: r.user?.additionalInformation?.profileImage || null,
        _id: r.user?._id,
        name: `${r.user?.firstName || ""} ${r.user?.lastName || ""}`.trim(),
      },
    }));

    return sendSuccess(res, 200, "Course details fetched successfully", {
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        whatYouWillLearn: course.whatYouWillLearn,
        requirements: course.requirements,
        category: course.category,
        price: course.price,
        thumbnail: course.thumbnail,
        averageRating: course.averageRating || 0,
        totalStudents: course.totalStudentsCount || 0,
        totalLectures: lessons.length,
        totalDuration: `${hours}h ${minutes}m`,
        instructor: course.instructor,
        curriculum: course.courseContent,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Course preview (admin + instructor)
export const getCoursePreview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { role, id: requesterId } = req.user;

    if (role !== "admin" && role !== "instructor") {
      return next(new AppError(403, "Unauthorized"));
    }

    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("category", "name")
      .populate({
        path: "instructor",
        select: "firstName lastName email",
        populate: {
          path: "additionalInformation",
          select: "about profileImage",
        },
      })
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
          select: "title description duration videoUrl",
        },
      })
      .populate({
        path: "ratingAndReviews",
        populate: {
          path: "user",
          select: "firstName lastName email additionalInformation",
          populate: { path: "additionalInformation", select: "profileImage" },
        },
      })
      .lean();

    if (!course) return next(new AppError(404, "Course not found"));

    if (
      role === "instructor" &&
      course.instructor?._id?.toString() !== requesterId.toString()
    ) {
      return next(new AppError(403, "Unauthorized"));
    }
    const courseContent = (course.courseContent ||
      []) as unknown as PopulatedSection[];

    const lessons = courseContent.flatMap((s) => s.lesson || []);

    const { hours, minutes } = calculateLessonStats(lessons);

    const ratings = (course.ratingAndReviews ||
      []) as unknown as PopulatedRating[];

    const averageRating = ratings.length
      ? Number(
          (
            ratings.reduce((sum, r) => sum + (r.rating || 0), 0) /
            ratings.length
          ).toFixed(1),
        )
      : 0;

    const formattedReviews = ratings.map((r) => ({
      _id: r._id,
      rating: r.rating,
      review: r.review,
      user: r.user
        ? {
            _id: r.user._id,
            name: `${r.user.firstName} ${r.user.lastName}`,
            email: r.user.email,
            profileImage: r.user.additionalInformation?.profileImage || null,
          }
        : null,
    }));

    return sendSuccess(res, 200, "Course preview fetched successfully", {
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        whatYouWillLearn: course.whatYouWillLearn,
        requirements: course.requirements,
        category: course.category,
        price: course.price,
        thumbnail: course.thumbnail,
        averageRating,
        totalStudents: course.totalStudentsCount || 0,
        totalLectures: lessons.length,
        totalDuration: `${hours}h ${minutes}m`,
        status: course.status,
        createdAt: course.createdAt,
        instructor: course.instructor,
        curriculum: course.courseContent,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Course content (enrolled student)
export const getCourseContent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(id)
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
          select: "title description duration videoUrl",
        },
      })
      .lean();

    if (!course) return next(new AppError(404, "Course not found"));

    const isEnrolled = course.enrolledStudents?.some(
      (s) => s.toString() === userId,
    );
    if (!isEnrolled) {
      return next(new AppError(403, "You are not enrolled in this course"));
    }

    const courseContent = (course.courseContent ||
      []) as unknown as PopulatedSection[];

    const lessons = courseContent.flatMap((s) => s.lesson || []);

    const progress = await CourseProgress.findOne({ userId, courseId: id });
    const completedLessons = progress?.completedVideos || [];
    const completedSet = new Set(completedLessons.map(String));

    const progressPercentage = lessons.length
      ? Math.round((completedLessons.length / lessons.length) * 100)
      : 0;

    const courseContentWithCompletion = courseContent.map((section) => ({
      ...section,
      lesson: (section.lesson || []).map((lsn) => ({
        ...lsn,
        isCompleted: completedSet.has(lsn._id.toString()),
      })),
    }));

    return sendSuccess(res, 200, "Course content fetched successfully", {
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        courseContent: courseContentWithCompletion,
        completedLessons,
        progressPercentage,
      },
    });
  } catch (error) {
    return next(error);
  }
};
