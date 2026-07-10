import express from "express";
const router = express.Router();
import { isAuthenticated, isInstructor } from "../middleware/authMiddleware.js";
import { getInstructorUsers } from "../controllers/instructorController.js";

router.get("/students", isAuthenticated, isInstructor, getInstructorUsers);

export default router;
