"use strict"

import express from "express";
import asyncHandler from "express-async-handler";
import userController from "../controllers/user.controller.js";
import { validate } from "../../../shared/middlewares/validate.middleware.js";
import userValidation from "../validations/user.validation.js";
import {
  createRateLimiter,
  createBruteForceGuard,
} from "../../../shared/middlewares/rateLimit.middleware.js";
import {
  AUTH_RATE_LIMIT_WINDOW_MS,
  AUTH_RATE_LIMIT_MAX,
  LOGIN_BLOCK_WINDOW_MS,
  LOGIN_MAX_FAILED_ATTEMPTS,
} from "../../../shared/constants/app.constants.js";

const router = express.Router();

const authRateLimiter = createRateLimiter({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  keyPrefix: "auth",
  message: "Too many auth requests. Please try again later.",
});

const loginBruteForceGuard = createBruteForceGuard({
  windowMs: LOGIN_BLOCK_WINDOW_MS,
  maxFailedAttempts: LOGIN_MAX_FAILED_ATTEMPTS,
});

router.post(
  "/register",
  authRateLimiter,
  validate(userValidation.register),
  asyncHandler(userController.register),
);

router.post(
  "/login",
  authRateLimiter,
  loginBruteForceGuard,
  validate(userValidation.login),
  asyncHandler(userController.login),
);

router.post(
  "/refresh",
  authRateLimiter,
  validate(userValidation.refresh),
  asyncHandler(userController.refresh),
);

router.post(
  "/logout",
  authRateLimiter,
  validate(userValidation.emptyBody),
  asyncHandler(userController.logout),
);

export default router;
