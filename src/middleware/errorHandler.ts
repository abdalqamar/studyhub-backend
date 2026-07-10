import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

const isDevelopment = process.env.NODE_ENV !== "production";

const STATUS_TITLES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

const normalizeStatus = (rawStatus: unknown): number => {
  const status = Number(rawStatus);
  if (!Number.isInteger(status) || status < 400 || status > 599) return 500;
  return status;
};

export default function errorHandler(
  err: AppError & Record<string, unknown>,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) return next(err);

  if (isDevelopment) {
    console.error("[ErrorHandler]", err);
  } else {
    console.error(err?.message || err);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = err.errors as Record<string, { message: string }>;
    const messages = Object.values(errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: messages[0] || "Validation failed" });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const keyValue = err.keyValue as Record<string, unknown>;
    const field = Object.keys(keyValue || {})[0] || "field";
    return res
      .status(409)
      .json({ success: false, message: `${field} already exists` });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  const status = normalizeStatus(err?.statusCode || err?.status);
  const message =
    status === 500
      ? "An unexpected error occurred."
      : err?.message || STATUS_TITLES[status] || "Error";

  const body: Record<string, unknown> = { success: false, message };

  if (isDevelopment) {
    body.stack = err?.stack || null;
  }

  return res.status(status).json(body);
}
