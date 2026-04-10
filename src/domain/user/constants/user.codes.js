"use strict"

/**
 * Authentication & User Domain Error Codes
 * Prefix: 10xxx
 */
export const USER_CODES = {
    SUCCESS: "00000",
    
    // Auth Errors - 101xx
    LOGIN_FAILED: { code: "10101", message: "Invalid username or password" },
    REFRESH_TOKEN_INVALID: { code: "10102", message: "Invalid refresh token" },
    REFRESH_TOKEN_MISSING: { code: "10103", message: "Missing refresh token" },
    
    // User Errors - 102xx
    USER_NOT_FOUND: { code: "10201", message: "User not found" },
    USERNAME_EXISTS: { code: "10202", message: "Username already exists" },
    USER_NOT_REGISTERED: { code: "10203", message: "User not registered properly" },
    USER_BLOCKED: { code: "10204", message: "User is blocked" },
};
