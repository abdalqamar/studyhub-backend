import express from "express";
const router = express.Router();

import { isAuthenticated, isAdmin } from "../middleware/authMiddleware.js";
import {
  getAllCoursesAdmin,
  approveCourse,
  rejectCourse,
} from "../controllers/adminController.js";

router.get("/courses", isAuthenticated, isAdmin, getAllCoursesAdmin);
router.patch("/courses/:id/approve", isAuthenticated, isAdmin, approveCourse);
router.patch("/courses/:id/reject", isAuthenticated, isAdmin, rejectCourse);

export default router;
