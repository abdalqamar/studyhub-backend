import express from "express";
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from "../controllers/lessonController.js";
import upload from "../utils/multer.js";

import { isAuthenticated, isInstructor } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

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
  "/lessons/:lessonId",
  isAuthenticated,
  isInstructor,
  upload.fields([{ name: "videoFile", maxCount: 1 }]),
  updateLesson
);

// Delete lesson
router.delete(
  "/lessons/:lessonId",
  isAuthenticated,
  isInstructor,
  deleteLesson
);

export default router;
