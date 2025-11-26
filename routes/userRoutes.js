import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import {
  updateProfile,
  updateProfileImage,
  getUserDetails,
  getEnrolledCourses,
} from "../controllers/profileController.js";
import upload from "../utils/multer.js";
const router = express.Router();

router.put("/update-profile", isAuthenticated, updateProfile);

router.put(
  "/update-photo",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  isAuthenticated,
  updateProfileImage
);

router.get("/enrolled-courses", isAuthenticated, getEnrolledCourses);
router.get("/:id", isAuthenticated, getUserDetails);

export default router;
