import "dotenv/config";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import database from "./config/db.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import corsConfig from "./config/cors.js";
import errorHandler from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";
import { razorpayWebhook } from "./controllers/paymentController.js";

const app = express();

app.set("trust proxy", 1);

// Security
app.use(helmet());
app.use(cors(corsConfig));

// Rate limiting — general API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many requests, please try again after 15 minutes",
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many attempts, please try again after 15 minutes",
    });
  },
});

app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook,
);

app.use("/api/v1", apiLimiter);
// app.use("/api/v1");

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authLimiter, authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/instructor", instructorRoutes);
app.use("/api/v1/payment", paymentRoutes);

// Health check
app.get("/", (_, res) =>
  res.json({ success: true, message: "StudyHub API is running" }),
);

app.get("/health", async (_, res) => {
  const state = mongoose.connection.readyState;
  const healthy = state === 1;
  res.status(healthy ? 200 : 503).json({ success: healthy, dbState: state });
});

// 404
app.use((req, res, next) => {
  next(new AppError(404, `Route ${req.originalUrl} not found`));
});

// Global error handler
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 5000;
let server: ReturnType<typeof app.listen> | undefined;

const startServer = async () => {
  try {
    await database();
    server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const SHUTDOWN_TIMEOUT_MS = 10_000;

const shutdown = (signal: string, exitCode: number = 0) => {
  console.log(`Received ${signal}. Shutting down...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(exitCode || 1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  if (server) {
    server.close(async (err) => {
      if (err) console.error("Error closing server:", err);
      try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
      } catch (e) {
        console.error("Error during MongoDB disconnect:", e);
      }
      clearTimeout(forceExitTimer);
      process.exit(exitCode);
    });
  } else {
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  }
};

process.on("SIGINT", () => shutdown("SIGINT", 0));
process.on("SIGTERM", () => shutdown("SIGTERM", 0));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException", 1);
});
