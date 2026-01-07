import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import database from "./config/db.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { razorpayWebhook } from "./controllers/paymentController.js";
import corsOptions from "./config/cors.js";

const app = express();

// webhook
app.post(
  "/api/v1/payment/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// CORS setup
app.use(cors(corsOptions));

// Database connection
database();

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.get("/", (_, res) => {
  res.send("Hello from StudyHub");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
