// import express from "express";
// const router = express.Router();

// import upload from "../utils/multer.js";

// // CONTROLLERS

// import {
//   createCourse,
//   deleteCourse,
//   updateCourse,
//   getPublicCourses,
//   getCourseDetails,
//   getCoursePreview,
//   getCourseById,
//   getCourseContent,
//   fetchAllCourses,
// } from "../controllers/courseController.js";

// import {
//   createReview,
//   updateReview,
//   deleteReview,
// } from "../controllers/reviewController.js";

// import {
//   createSection,
//   deleteSection,
//   updateSection,
// } from "../controllers/sectionController.js";

// import {
//   createLesson,
//   deleteLesson,
//   updateLesson,
// } from "../controllers/lessonController.js";

// // MIDDLEWARE

// import {
//   isAuthenticated,
//   isInstructor,
//   isStudent,
// } from "../middleware/authMiddleware.js";

// // PUBLIC ROUTES (NO AUTH)

// // Public courses (approved only + filters)
// router.get("/", getPublicCourses);

// // ADMIN / INSTRUCTOR DASHBOARD
// router.get("/manage", isAuthenticated, fetchAllCourses);

// //  COURSE VIEW ROUTES

// // Course preview (logged-in users)
// router.get("/:id/preview", isAuthenticated, getCoursePreview);

// // Student enrolled course content
// router.get("/:id/content", isAuthenticated, isStudent, getCourseContent);

// // Public course details (KEEP AFTER /manage)
// router.get("/:id", getCourseDetails);

// //  REVIEWS
// router.put("/:id/reviews", isAuthenticated, updateReview);
// router.delete("/:id/reviews", deleteReview);
// router.post("/:id/reviews", isAuthenticated, createReview);

// // INSTRUCTOR COURSE CRUD ROUTES
// // Create course
// router.post(
//   "/",
//   isAuthenticated,
//   isInstructor,
//   upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
//   createCourse,
// );

// // Update course
// router.put(
//   "/:id",
//   isAuthenticated,
//   isInstructor,
//   upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
//   updateCourse,
// );

// // Delete course
// router.delete("/:id", isAuthenticated, isInstructor, deleteCourse);

// // Get course for editing
// router.get("/edit/:id", isAuthenticated, isInstructor, getCourseById);

// // SECTIONS
// router.post(
//   "/:courseId/sections",
//   isAuthenticated,
//   isInstructor,
//   createSection,
// );

// router.put(
//   "/:courseId/sections/:sectionId",
//   isAuthenticated,
//   isInstructor,
//   updateSection,
// );

// router.delete(
//   "/:courseId/sections/:sectionId",
//   isAuthenticated,
//   isInstructor,
//   deleteSection,
// );

// //  LESSONS

// router.post(
//   "/:courseId/sections/:sectionId/lessons",
//   isAuthenticated,
//   isInstructor,
//   upload.fields([{ name: "videoFile", maxCount: 1 }]),
//   createLesson,
// );

// router.put(
//   "/sections/:sectionId/lessons/:lessonId",
//   isAuthenticated,
//   isInstructor,
//   upload.fields([{ name: "videoFile", maxCount: 1 }]),
//   updateLesson,
// );

// router.delete(
//   "/:sectionId/lessons/:lessonId",
//   isAuthenticated,
//   isInstructor,
//   deleteLesson,
// );

// export default router;

import express from "express";
const router = express.Router();

import upload from "../utils/multer.js";

// CONTROLLERS
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

// MIDDLEWARE
import {
  isAdmin,
  isAuthenticated,
  isInstructor,
  isInstructorOrAdmin,
  isStudent,
} from "../middleware/authMiddleware.js";

// PUBLIC ROUTES (NO AUTH)

router.get("/", getPublicCourses);

// STATIC ROUTES — pehle aani chahiye /:id se

// Admin / Instructor dashboard courses
router.get("/manage", isAuthenticated, fetchAllCourses);

// Instructor — course edit karne ke liye (MUST be before /:id)
router.get("/edit/:id", isAuthenticated, isInstructor, getCourseById);

// DYNAMIC ROUTES — /:id wale

// Course preview — admin & instructor
router.get("/:id/preview", isAuthenticated, getCoursePreview);

// Student enrolled course content
router.get("/:id/content", isAuthenticated, isStudent, getCourseContent);

// Public course details — sabse neeche kyunki /:id sabse generic hai
router.get("/:id", getCourseDetails);

// REVIEWS

router.post("/:id/reviews", isAuthenticated, createReview);
router.put("/:id/reviews", isAuthenticated, updateReview);
router.delete("/:id/reviews", isAuthenticated, deleteReview);

// INSTRUCTOR — COURSE CRUD

// Create course
router.post(
  "/",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  createCourse,
);

// Update course
router.put(
  "/:id",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "courseThumbnail", maxCount: 1 }]),
  updateCourse,
);

// Delete course
router.delete("/:id", isAuthenticated, isInstructorOrAdmin, deleteCourse);

// SECTIONS

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

// LESSONS

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
