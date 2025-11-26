import express from "express";
import {
  createOrder,
  razorpayWebhook,
} from "../controllers/paymentController.js";

const router = express.Router();
router.post("/order", createOrder);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);
export default router;
