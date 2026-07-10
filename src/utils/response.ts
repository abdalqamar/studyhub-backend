import { Response } from "express";

export const sendSuccess = (
  res: Response,
  statusCode: number = 200,
  message: string = "Success",
  data: Record<string, unknown> = {},
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

export const sendError = (
  res: Response,
  statusCode: number = 500,
  message: string = "Something went wrong",
  extras: Record<string, unknown> = {},
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...extras,
  });
};
