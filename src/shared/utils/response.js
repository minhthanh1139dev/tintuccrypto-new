"use strict";

import { StatusCodes, getReasonPhrase } from "http-status-codes";

// ─── Success ────────────────────────────────────────────────────────────────

class SuccessResponse {
  constructor({ message, data, statusCode = StatusCodes.OK }) {
    this.status = "success";
    this.code = statusCode;
    this.message = message || getReasonPhrase(statusCode);
    this.data = data ?? null;
  }

  send(res) {
    return res.status(this.code).json(this);
  }
}

class OK extends SuccessResponse {
  constructor(params = {}) {
    super({ ...params, statusCode: StatusCodes.OK });
  }
}

class CREATED extends SuccessResponse {
  constructor(params = {}) {
    super({ ...params, statusCode: StatusCodes.CREATED });
  }
}

// ─── Error ──────────────────────────────────────────────────────────────────

class ErrorResponse extends Error {
  constructor({
    message,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    errorCode,
    details,
  }) {
    super(message || getReasonPhrase(statusCode));
    this.name = this.constructor.name;
    this.status = "error";
    this.statusCode = statusCode;
    this.code = statusCode;
    this.errorCode = errorCode ?? null; // FIX: was never assigned before
    this.details = details ?? null;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      code: this.statusCode,
      error: {
        code: this.errorCode,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    });
  }
}

// ─── Concrete error classes ──────────────────────────────────────────────────

class BAD_REQUEST extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.BAD_REQUEST,
      errorCode: params.errorCode || "BAD_REQUEST",
    });
  }
}

class UNAUTHORIZED extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.UNAUTHORIZED,
      errorCode: params.errorCode || "UNAUTHORIZED",
    });
  }
}

class FORBIDDEN extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.FORBIDDEN,
      errorCode: params.errorCode || "FORBIDDEN",
    });
  }
}

class NOT_FOUND extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.NOT_FOUND,
      errorCode: params.errorCode || "NOT_FOUND",
    });
  }
}

// FIX: thiếu dấu cách + thêm vào export
class CONFLICT extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.CONFLICT,
      errorCode: params.errorCode || "CONFLICT",
    });
  }
}

class UNPROCESSABLE_ENTITY extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
      errorCode: params.errorCode || "UNPROCESSABLE_ENTITY",
    });
  }
}

class TOO_MANY_REQUESTS extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      errorCode: params.errorCode || "TOO_MANY_REQUESTS",
    });
  }
}

class INTERNAL_SERVER_ERROR extends ErrorResponse {
  constructor(params = {}) {
    super({
      ...params,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      errorCode: params.errorCode || "INTERNAL_SERVER_ERROR",
    });
  }
}

export {
  // Success
  OK,
  CREATED,
  ErrorResponse,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  UNPROCESSABLE_ENTITY,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
};
