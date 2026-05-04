"use strict";

import digestService from "../services/digest.service.js";

class DigestJob {
  /** Global hourly digest — runs at minute 0 every hour */
  globalHourly = {
    name: "Hourly Digest (Global)",
    schedule: "0 * * * *",
    action: async () => {
      await digestService.generate({ type: "1h", region: "global", provider: "gemini", model: "gemini-1.5-flash" });
    },
  };

  /** Vietnam hourly digest — runs 5 min after global */
  vietnamHourly = {
    name: "Hourly Digest (Vietnam)",
    schedule: "5 * * * *",
    action: async () => {
      await digestService.generate({ type: "1h", region: "vietnam", provider: "gemini", model: "gemini-1.5-flash" });
    },
  };

  /** Daily digest — runs at 23:30 UTC */
  globalDaily = {
    name: "Daily Digest (Global)",
    schedule: "30 23 * * *",
    action: async () => {
      await digestService.generate({ type: "daily", region: "global", provider: "grok", model: "grok-3" });
    },
  };

  /** Weekly digest — runs Sunday 23:45 UTC */
  globalWeekly = {
    name: "Weekly Digest (Global)",
    schedule: "45 23 * * 0",
    action: async () => {
      await digestService.generate({ type: "weekly", region: "global", provider: "grok", model: "grok-3" });
    },
  };
}

export default new DigestJob();
