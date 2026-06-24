import express from "express";
import {
  isAuthenticated,
  updateLastActive,
} from "../middleware/authMiddleware.js";
import {
  updateProfile,
  updateProfileImage,
  getUserDetails,
  getEnrolledCourses,
} from "../controllers/profileController.js";
import upload from "../utils/multer.js";
const router = express.Router();

router.use(isAuthenticated, updateLastActive);

router.put("/update-profile", updateProfile);
router.put(
  "/update-photo",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  updateProfileImage,
);
router.get("/enrolled-courses", getEnrolledCourses);
router.get("/:id", getUserDetails);

export default router;
