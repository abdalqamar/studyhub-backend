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
import { razorpayWebhook } from "./controllers/paymentController.js";
import corsConfig from "./config/cors.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Webhook
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook,
);

// Middleware )
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// CORS setup
app.use(cors(corsConfig));

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/instructor", instructorRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.get("/", (_, res) => {
  res.send("Hello from StudyHub");
});

// Global error handler
app.use(errorHandler);

// Simple health endpoint to check DB connectivity
app.get("/health", async (_, res) => {
  const state = mongoose.connection.readyState;
  const healthy = state === 1;
  res.status(healthy ? 200 : 503).json({ healthy, dbState: state });
});

// Start server after DB connection
const PORT = process.env.PORT || 5000;
let server;

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
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down server...`);
  if (server) {
    try {
      server.close(async (err) => {
        if (err) {
          console.error("Error closing server:", err);
        }
        try {
          await mongoose.disconnect();
          console.log("MongoDB disconnected");
        } catch (e) {
          console.error("Error during MongoDB disconnect:", e);
        }
        process.exit(0);
      });
    } catch (closeErr) {
      console.error("Error closing server:", closeErr);
      mongoose
        .disconnect()
        .then(() => console.log("MongoDB disconnected"))
        .catch((e) => console.error("Error during MongoDB disconnect:", e))
        .finally(() => process.exit(0));
    }
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown("uncaughtException");
});
