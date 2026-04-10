"use strict"

export const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX = 10;

export const LOGIN_BLOCK_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILED_ATTEMPTS = 5;

export const UPLOAD_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const UPLOAD_RATE_LIMIT_MAX = 30;

export const MAX_UPLOAD_SIZE_MB = 20;

export const ALLOWED_FILE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/zip",
];
