import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import {
  createOrder,
  razorpayWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();
router.post("/order", isAuthenticated, createOrder);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

export default router;
