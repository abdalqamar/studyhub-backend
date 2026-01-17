import express from "express";
const router = express.Router();

import { isAuthenticated, isAdmin } from "../middleware/authMiddleware.js";
import {
  approveCourse,
  rejectCourse,
  getAdminUsers,
  updateUserStatus,
  deleteUserByAdmin,
} from "../controllers/adminController.js";

router.get("/users", isAuthenticated, isAdmin, getAdminUsers);
router.patch("/courses/:id/approve", isAuthenticated, isAdmin, approveCourse);
router.patch("/courses/:id/reject", isAuthenticated, isAdmin, rejectCourse);
router.patch("/users/:id/status", isAuthenticated, isAdmin, updateUserStatus);
router.delete("/users/:id", isAuthenticated, isAdmin, deleteUserByAdmin);

export default router;
