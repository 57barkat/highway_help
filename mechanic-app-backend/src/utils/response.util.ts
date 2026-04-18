import { Response } from "express";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
  });

export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: Record<string, unknown>,
) =>
  res.status(statusCode).json({
    success: true,
    message,
    ...(data ?? {}),
  });
