import express from "express";
const router = express.Router();

import upload from "../utils/multer.js";

// Controllers
import {
  createCourse,
  deleteCourse,
  updateCourse,
  getPublicCourses,
  getCourseDetails,
  getCoursePreview,
  getCourseById,
  getCourseContent,
  fetchAllCourses,
} from "../controllers/courseController.js";

import {
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

import {
  createSection,
  deleteSection,
  updateSection,
} from "../controllers/sectionController.js";

import {
  createLesson,
  deleteLesson,
  updateLesson,
} from "../controllers/lessonController.js";

// Middleware
import {
  isAuthenticated,
  isInstructor,
  isInstructorOrAdmin,
  isStudent,
} from "../middleware/authMiddleware.js";

// Public routes
router.get("/", getPublicCourses);

// Static routes
router.get("/manage", isAuthenticated, fetchAllCourses);
router.get("/edit/:id", isAuthenticated, isInstructor, getCourseById);

// Dynamic routes
router.get("/:id/preview", isAuthenticated, getCoursePreview);
router.get("/:id/content", isAuthenticated, isStudent, getCourseContent);
router.get("/:id", getCourseDetails);

// Review routes
router.post("/:id/reviews", isAuthenticated, createReview);
router.put("/:id/reviews", isAuthenticated, updateReview);
router.delete("/:id/reviews", isAuthenticated, deleteReview);

// Course routes
router.post(
  "/",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  createCourse,
);

router.put(
  "/:id",
  isAuthenticated,
  isInstructorOrAdmin,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  updateCourse,
);

router.delete("/:id", isAuthenticated, isInstructorOrAdmin, deleteCourse);

// Section routes
router.post(
  "/:courseId/sections",
  isAuthenticated,
  isInstructor,
  createSection,
);

router.put(
  "/:courseId/sections/:sectionId",
  isAuthenticated,
  isInstructor,
  updateSection,
);

router.delete(
  "/:courseId/sections/:sectionId",
  isAuthenticated,
  isInstructor,
  deleteSection,
);

// Lesson routes
router.post(
  "/:courseId/sections/:sectionId/lessons",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "videoFile", maxCount: 1 }]),
  createLesson,
);

router.put(
  "/:courseId/sections/:sectionId/lessons/:lessonId",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "videoFile", maxCount: 1 }]),
  updateLesson,
);

router.delete(
  "/:courseId/sections/:sectionId/lessons/:lessonId",
  isAuthenticated,
  isInstructor,
  deleteLesson,
);

export default router;
