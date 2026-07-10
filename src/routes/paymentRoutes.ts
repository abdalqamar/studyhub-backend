import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import { createOrder } from "../controllers/paymentController.js";

const router = express.Router();
router.post("/order", isAuthenticated, createOrder);

export default router;
