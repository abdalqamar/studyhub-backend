import express from "express";
import {
  createSection,
  updateSection,
  deleteSection,
} from "../controllers/sectionController.js";
import { isAuthenticated, isInstructor } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.post(
  "/:courseId/sections",
  isAuthenticated,
  isInstructor,
  createSection
);

// Update section
router.put(
  "/sections/:sectionId",
  isAuthenticated,
  isInstructor,
  updateSection
);

// Delete section
router.delete(
  "/sections/:sectionId",
  isAuthenticated,
  isInstructor,
  deleteSection
);

export default router;
