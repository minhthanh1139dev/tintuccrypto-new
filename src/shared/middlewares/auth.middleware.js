"use strict"

import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "./errorHandler.middleware.js";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    next(new AppError("Unauthorized: Invalid or missing token", 401, "UNAUTHORIZED"));
  }
};

export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (req.user && req.user.role === "admin") {
      return next();
    }
    return next(new AppError("Admin access required", 403, "FORBIDDEN"));
  });
};

export const verifyUser = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (req.user && (req.user.role === "user" || req.user.role === "admin")) {
      return next();
    }
    return next(new AppError("User access required", 403, "FORBIDDEN"));
  });
};
