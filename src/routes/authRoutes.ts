import express from "express";
const router = express.Router();
import { isAuthenticated } from "../middleware/authMiddleware.js";
import {
  register,
  login,
  logout,
  sendOtp,
  forgotPassword,
  resetPassword,
  refreshToken,
  changePassword,
} from "../controllers/authController.js";

router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/update-password", isAuthenticated, changePassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;
