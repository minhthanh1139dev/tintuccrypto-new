"use strict"

import rateLimit from "express-rate-limit";
import { AppError } from "./errorHandler.middleware.js";

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || "unknown";

export const createRateLimiter = ({ windowMs, max, keyPrefix = "global", message = "Too many requests" }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      return `${keyPrefix}:${ip}`;
    },
    handler: (req, res, next) => {
      next(new AppError(message, 429, "TOO_MANY_REQUESTS"));
    }
  });
};

export const createBruteForceGuard = ({
  windowMs,
  maxFailedAttempts,
  keyPrefix = "login",
  message = "Too many failed login attempts. Try again later.",
}) => {
  return rateLimit({
    windowMs,
    max: maxFailedAttempts,
    skipSuccessfulRequests: true, // Only count failed status codes (>= 400)
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      const username = req.body?.username || "unknown";
      return `${keyPrefix}:${ip}:${username}`;
    },
    handler: (req, res, next) => {
      next(new AppError(message, 429, "TOO_MANY_REQUESTS"));
    }
  });
};
