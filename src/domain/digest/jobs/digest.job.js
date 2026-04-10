"use strict";

import digestService from "../services/digest.service.js";

class DigestJob {
  /** Global 4h digest — runs at minute 0 every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC) */
  global4h = {
    name: "4h Digest (Global)",
    schedule: "0 */4 * * *",
    action: async () => {
      await digestService.generate({ type: "4h", region: "global", provider: "grok", model: "grok-3" });
    },
  };

  /** Vietnam 4h digest — runs 5 min after global to avoid overlap */
  vietnam4h = {
    name: "4h Digest (Vietnam)",
    schedule: "5 */4 * * *",
    action: async () => {
      await digestService.generate({ type: "4h", region: "vietnam", provider: "grok", model: "grok-3" });
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
