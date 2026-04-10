"use strict";

/**
 * Digest Domain Error Codes
 * Prefix: 31xxx
 */
export const DIGEST_CODES = {
  SUCCESS: "00000",

  DIGEST_NOT_FOUND: { code: "31101", message: "Digest not found" },
  DIGEST_GENERATION_FAILED: { code: "31102", message: "Failed to generate digest" },
  DIGEST_ALREADY_EXISTS: { code: "31103", message: "Digest for this period already exists" },
  DIGEST_AI_PARSE_ERROR: { code: "31104", message: "Failed to parse AI response" },
};
