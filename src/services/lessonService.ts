import Section from "../models/sectionModal.js";
import Lesson from "../models/lessonModal.js";
import Course from "../models/courseModal.js";
import {
  uploadWithRollback,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { calculateLessonStats } from "../utils/calculateLessonStats.js";
import { AppError } from "../utils/AppError.js";
import {
  CreateLessonDTO,
  ILesson,
  UpdateLessonDTO,
} from "../types/lesson.types.js";

// Refresh totalLessons + totalDuration on the course after any lesson change
export const syncCourseTotals = async (courseId: string) => {
  const course = await Course.findById(courseId).populate({
    path: "courseContent",
    populate: { path: "lesson", select: "duration" },
  });
  if (!course) return;

  const sections = course.courseContent as unknown as {
    lesson: { duration?: number }[];
  }[];
  const lessons = sections.flatMap((s) => s.lesson || []);
  const { hours, minutes } = calculateLessonStats(lessons);

  await Course.findByIdAndUpdate(courseId, {
    totalLessons: lessons.length,
    totalDuration: `${hours}h ${minutes}m`,
  });
};

// Create
export const createLesson = async (
  { title, description }: CreateLessonDTO,
  courseId: string,
  sectionId: string,
  videoFile: Express.Multer.File,
) => {
  if (!title?.trim() || !description?.trim())
    throw new AppError(400, "Title and description are required");
  if (!videoFile) throw new AppError(400, "Video file is required");

  const sectionExists = await Section.findById(sectionId);
  if (!sectionExists) throw new AppError(404, "Section not found");

  const { uploadResult, rollback } = await uploadWithRollback(videoFile.path);

  let lesson;
  try {
    lesson = await Lesson.create({
      title: title.trim(),
      description: description.trim(),
      videoUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      duration: uploadResult.duration
        ? parseFloat((uploadResult.duration / 60).toFixed(2))
        : 0,
    });
  } catch (dbErr) {
    await rollback();
    throw dbErr;
  }

  await Section.findByIdAndUpdate(sectionId, { $push: { lesson: lesson._id } });
  await syncCourseTotals(courseId);

  return lesson;
};

export const updateLesson = async (
  lessonId: string,
  courseId: string,
  { title, description }: UpdateLessonDTO,
  videoFile: Express.Multer.File | null,
) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, "Lesson not found");

  const hasUpdate = title || description || videoFile;
  if (!hasUpdate)
    throw new AppError(400, "At least one field is required to update");

  const updates: Partial<ILesson> = {};
  if (title?.trim()) updates.title = title.trim();
  if (description?.trim()) updates.description = description.trim();

  if (videoFile) {
    const maxSize = 200 * 1024 * 1024;
    if (videoFile.size > maxSize)
      throw new AppError(400, "Video file too large (max 200MB)");

    const oldUrl = lesson.videoUrl;
    const oldPublicId = lesson.publicId;

    const { uploadResult, rollback } = await uploadWithRollback(videoFile.path);

    try {
      updates.videoUrl = uploadResult.secure_url;
      updates.publicId = uploadResult.public_id;
      updates.duration = uploadResult.duration
        ? parseFloat((uploadResult.duration / 60).toFixed(2))
        : undefined;

      const updated = await Lesson.findByIdAndUpdate(lessonId, updates, {
        new: true,
        runValidators: true,
      });

      // Delete old video after successful save
      if (oldUrl) deleteFromCloudinary(oldUrl, oldPublicId).catch(() => null);

      await syncCourseTotals(courseId);
      return updated;
    } catch (saveErr) {
      await rollback();
      throw saveErr;
    }
  }

  const updated = await Lesson.findByIdAndUpdate(lessonId, updates, {
    new: true,
    runValidators: true,
  });
  return updated;
};

export const deleteLesson = async (
  lessonId: string,
  sectionId: string,
  courseId: string,
) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, "Lesson not found");

  // Best-effort Cloudinary delete
  if (lesson.videoUrl) {
    deleteFromCloudinary(lesson.videoUrl, lesson.publicId).catch(() => null);
  }

  await Section.findByIdAndUpdate(sectionId, { $pull: { lesson: lessonId } });
  await Lesson.findByIdAndDelete(lessonId);
  await syncCourseTotals(courseId);
};
