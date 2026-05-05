import logger from "../utils/logger.js";
import { ErrorResponse, BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../utils/response.js";

export class AppError extends Error {
  constructor(message, statusCode = 400, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // New OOP ErrorResponse (from response.js)
  if (err instanceof ErrorResponse) {
    return err.send(res);
  }

  // Legacy AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      code: err.statusCode,
      error: { code: err.errorCode, message: err.message },
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return new BAD_REQUEST({ message: err.message, errorCode: "VALIDATION_ERROR" }).send(res);
  }

  // Unexpected error
  return new INTERNAL_SERVER_ERROR({ message: "Lỗi server" }).send(res);
};
