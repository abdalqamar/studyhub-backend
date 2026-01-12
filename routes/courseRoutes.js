import express from "express";
const router = express.Router();
import upload from "../utils/multer.js";
import {
  createCourse,
  deleteCourse,
  updateCourse,
  getAllCourses,
  getCourseDetails,
  getInstructorCourses,
  getCoursePreview,
  getCourseById,
  getCourseContent,
} from "../controllers/courseController.js";

import {
  createReview,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

import {
  isAuthenticated,
  isInstructor,
  isStudent,
} from "../middleware/authMiddleware.js";
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

router.get("/", getAllCourses);

// INSTRUCTOR ROUTES
router.get(
  "/instructor/my-courses",
  isAuthenticated,
  isInstructor,
  getInstructorCourses
);

router.post(
  "/",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  createCourse
);

router.put(
  "/:id",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  updateCourse
);

router.delete("/:id", isAuthenticated, isInstructor, deleteCourse);
router.get("/:id/content", isAuthenticated, isStudent, getCourseContent);
router.get("/:id/preview", isAuthenticated, getCoursePreview);
router.get("/:id", getCourseDetails); // for public access (course marketing page)
router.get("/edit/:id", isAuthenticated, isInstructor, getCourseById);

// REVIEWS/RATINGS

router.post("/:id/reviews", isAuthenticated, createReview);

router.post(
  "/:courseId/sections",
  isAuthenticated,
  isInstructor,
  createSection
);

// Update section
router.put(
  "/:courseId/sections/:sectionId",
  isAuthenticated,
  isInstructor,
  updateSection
);

// Delete section
router.delete(
  "/:courseId/sections/:sectionId",
  isAuthenticated,
  isInstructor,
  deleteSection
);

// Create lesson
router.post(
  "/:courseId/sections/:sectionId/lessons",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "videoFile", maxCount: 1 }]),
  createLesson
);

// Update lesson
router.put(
  "/sections/:sectionId/lessons/:lessonId",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "videoFile", maxCount: 1 }]),
  updateLesson
);

// Delete lesson
router.delete(
  "/:sectionId/lessons/:lessonId",
  isAuthenticated,
  isInstructor,
  deleteLesson
);

export default router;
