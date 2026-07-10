import jwt from "jsonwebtoken";
import User from "../models/userModal.js";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";
import { TokenPayload } from "../types/auth.types.js";

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token)
      return next(new AppError(401, "No token, authorization denied"));

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!,
    ) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired, please login again", {
        code: "TOKEN_EXPIRED",
      });
    }
    return sendError(res, 401, "Invalid token");
  }
};

const isInstructorOrAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "instructor" && req.user?.role !== "admin") {
    return next(new AppError(403, "Access denied: Instructor or Admin only"));
  }
  next();
};

const isStudent = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "student") {
    return next(new AppError(403, "Access denied: Students only"));
  }
  next();
};

const isInstructor = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "instructor") {
    return next(new AppError(403, "Access denied: Instructor only"));
  }
  next();
};

const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return next(new AppError(403, "Access denied: Admin only"));
  }
  next();
};

export {
  isAuthenticated,
  isStudent,
  isInstructor,
  isAdmin,
  isInstructorOrAdmin,
};
