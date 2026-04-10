"use strict"

/**
 * File Domain Error Codes
 * Prefix: 20xxx
 */
export const FILE_CODES = {
    SUCCESS: "00000",
    
    // File Errors - 201xx
    FILE_NOT_FOUND: { code: "20101", message: "File not found" },
    FILE_ACCESS_DENIED: { code: "20102", message: "Access denied: private file" },
    FILE_CONTENT_BLOCKED: { code: "20103", message: "File content is blocked for security reasons" },
    FILE_TYPE_MISMATCH: { code: "20104", message: "File type mismatch for this endpoint" },
    FILE_NOT_UPLOADED: { code: "20105", message: "No file uploaded" },
    
    // Storage Errors - 202xx
    STORAGE_WRITE_FAILED: { code: "20201", message: "Failed to write file to storage" },
    STORAGE_READ_FAILED: { code: "20202", message: "Failed to read file from storage" },
};
