"use strict";

/**
 * News Domain Error Codes
 * Prefix: 30xxx
 */
export const NEWS_CODES = {
  SUCCESS: "00000",

  NEWS_NOT_FOUND: { code: "30101", message: "News item not found" },
  NEWS_DUPLICATE: { code: "30102", message: "Duplicate news source URL" },
};
