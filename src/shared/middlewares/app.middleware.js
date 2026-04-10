"use strict";

import { AppError } from "./errorHandler.middleware.js";
import config from "../../config/app.config.js";

const APP_KEY = config.app.key;

/**
 * Middleware to verify X-App-Key header
 */
export const verifyAppKey = (req, res, next) => {
  const appKey = req.headers["x-app-key"];

  if (!appKey || appKey !== APP_KEY) {
    return next(new AppError("Invalid or missing X-App-Key", 403, "FORBIDDEN"));
  }

  next();
};
