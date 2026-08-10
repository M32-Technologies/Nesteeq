import { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError.js";

type ErrorResponse = {
  success: false;
  status: string;
  message: string;
  details?: unknown;
  stack?: string;
};

type MongoServerError = Error & {
  code?: number;
  keyValue?: Record<string, unknown>;
};

const isProduction = process.env.NODE_ENV === "production";

const isMongoServerError = (error: unknown): error is MongoServerError =>
  error instanceof Error && "code" in error;

const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return new AppError("Validation failed", 400, Object.values(error.errors).map((err) => err.message));
  }

  if (error instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${error.path}: ${String(error.value)}`, 400);
  }

  if (isMongoServerError(error) && error.code === 11000) {
    return new AppError("Duplicate field value", 409, error.keyValue);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return new AppError("Invalid JSON body", 400);
  }

  return new AppError("Something went wrong", 500);
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const appError = normalizeError(error);

  if (!appError.isOperational || appError.statusCode >= 500) {
    console.error(error);
  }

  const response: ErrorResponse = {
    success: false,
    status: appError.status,
    message: appError.message,
  };

  if (appError.details !== undefined) {
    response.details = appError.details;
  }

  if (!isProduction) {
    response.stack = appError.stack;
  }

  res.status(appError.statusCode).json(response);
};
