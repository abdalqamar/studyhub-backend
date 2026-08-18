import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Course from "../models/course.model.js";
import Section from "../models/section.model.js";
import Lesson from "../models/lesson.model.js";
import User from "../models/user.model.js";
import {
  uploadWithRollback,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import {
  CreateCourseDTO,
  ICourse,
  UpdateCourseDTO,
} from "../types/course.types.js";
import { TokenPayload } from "../types/auth.types.js";
import CourseProgress from "../models/courseProgress.model.js";

//  Create
export const createCourse = async (
  fields: CreateCourseDTO,
  thumbnailFile: Express.Multer.File,
  instructorId: string,
) => {
  const {
    title,
    description,
    price,
    category,
    status,
    whatYouWillLearn,
    tags,
    requirements,
    instructions,
  } = fields;

  if (
    !title?.trim() ||
    !description?.trim() ||
    !whatYouWillLearn ||
    !price ||
    !category
  ) {
    throw new AppError(400, "All fields are mandatory");
  }

  const parsedPrice = Number(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    throw new AppError(400, "Price must be a valid non-negative number");
  }

  const isCategory = await Category.findById(category);
  if (!isCategory) throw new AppError(404, "Category not found");

  if (!thumbnailFile) throw new AppError(400, "Thumbnail image is required");

  const { uploadResult, rollback } = await uploadWithRollback(
    thumbnailFile.path,
    process.env.FOLDER_NAME,
  );

  let newCourse;
  try {
    newCourse = await Course.create({
      title: title.trim(),
      description: description.trim(),
      instructor: instructorId,
      price: parsedPrice,
      thumbnail: uploadResult.secure_url,
      thumbnailPublicId: uploadResult.public_id,
      category: isCategory._id,
      status: status || "draft",
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
      whatYouWillLearn: Array.isArray(whatYouWillLearn)
        ? whatYouWillLearn
        : [whatYouWillLearn],
      requirements: requirements || [],
      instructions: instructions || [],
    });
  } catch (dbErr) {
    await rollback();
    throw dbErr;
  }

  await Category.findByIdAndUpdate(category, {
    $push: { courses: newCourse._id },
  });

  return newCourse;
};

//  Get by ID
export const getCourseById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid course ID");

  const course = await Course.findById(id)
    .populate("instructor", "firstName lastName")
    .populate({ path: "courseContent", populate: { path: "lesson" } })
    .populate("ratingAndReviews")
    .populate("category", "name")
    .lean();

  if (!course) throw new AppError(404, "Course not found");
  return course;
};

//  Delete
export const deleteCourse = async (
  id: string,
  requestingUser: TokenPayload,
) => {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "Course not found");

  const isOwner = course.instructor.toString() === requestingUser.id;
  if (!isOwner && requestingUser.role !== "admin") {
    throw new AppError(403, "You are not authorized to delete this course");
  }

  if (course.thumbnail) {
    await deleteFromCloudinary(
      course.thumbnail,
      course.thumbnailPublicId,
    ).catch(() => null);
  }

  await Promise.all([
    User.updateMany(
      { _id: { $in: course.enrolledStudents } },
      { $pull: { enrolledCourses: id } },
    ),
    Category.findByIdAndUpdate(course.category, { $pull: { courses: id } }),
  ]);

  const sections = await Section.find({
    _id: { $in: course.courseContent },
  }).select("lesson");
  const allLessonIds = sections.flatMap((s) => s.lesson || []);

  await Promise.all([
    Lesson.deleteMany({ _id: { $in: allLessonIds } }),
    Section.deleteMany({ _id: { $in: course.courseContent } }),
    CourseProgress.deleteMany({ courseId: id }),
  ]);

  await Course.findByIdAndDelete(id);
};

//  Update
export const updateCourse = async (
  id: string,
  requestingUser: TokenPayload,
  body: UpdateCourseDTO,
  thumbnailFile: Express.Multer.File | null,
) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new AppError(400, "Invalid course ID");

  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "Course not found");

  const isOwner = course.instructor.toString() === requestingUser.id;
  if (!isOwner && requestingUser.role !== "admin") {
    throw new AppError(403, "You are not authorized to modify this course");
  }

  if (course.status === "rejected") {
    course.status = "pending";
    course.feedback = "";
  }

  const updates = buildCourseUpdates(body);

  if (
    updates.category &&
    updates.category.toString() !== course.category.toString()
  ) {
    const cat = await Category.findById(updates.category);
    if (!cat) throw new AppError(404, "Category not found");
  }

  if (thumbnailFile) {
    const oldUrl = course.thumbnail;
    const oldPublicId = course.thumbnailPublicId;

    const { uploadResult, rollback } = await uploadWithRollback(
      thumbnailFile.path,
      process.env.FOLDER_NAME,
    );

    try {
      updates.thumbnail = uploadResult.secure_url;
      updates.thumbnailPublicId = uploadResult.public_id;
      Object.assign(course, updates);
      await course.save();
      if (oldUrl) deleteFromCloudinary(oldUrl, oldPublicId).catch(() => null);
    } catch (saveErr) {
      await rollback();
      throw saveErr;
    }
  } else {
    Object.assign(course, updates);
    await course.save();
  }

  return Course.findById(id)
    .populate("instructor", "firstName lastName")
    .populate({ path: "courseContent", populate: { path: "lesson" } })
    .populate("category", "name")
    .lean();
};

//  Build Updates
const buildCourseUpdates = (body: UpdateCourseDTO): Partial<ICourse> => {
  const updates: Partial<ICourse> = {};

  (["title", "description"] as const).forEach((f) => {
    if (body[f]?.trim()) updates[f] = body[f]!.trim();
  });

  if (body.instructions?.trim()) {
    updates.instructions = body.instructions
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
  }

  // FIX: val variable mein store karo pehle — typeof check ke liye
  (["tags", "whatYouWillLearn", "requirements"] as const).forEach((f) => {
    const val = body[f];
    if (!val) return;
    if (typeof val === "string") {
      updates[f] = val
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
    } else if (Array.isArray(val)) {
      updates[f] = val.map((i) => String(i).trim()).filter(Boolean);
    }
  });

  if (body.price !== undefined) {
    const p = Number(body.price);
    if (!isNaN(p) && p >= 0) updates.price = p;
  }

  if (body.category) {
    updates.category = new mongoose.Types.ObjectId(body.category);
  }

  if (body.status) {
    updates.status = body.status as ICourse["status"];
  }

  return updates;
};
