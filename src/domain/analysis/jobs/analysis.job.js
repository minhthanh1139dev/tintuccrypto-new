"use strict";

import analysisService from "../services/analysis.service.js";

class AnalysisJob {
  /** Market analysis every 4 hours */
  marketAnalysis4h = {
    name: "Market Analysis (4h)",
    schedule: "0 */4 * * *", // 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
    action: async () => {
      await analysisService.performAnalysis();
    },
  };

  /** Market alerts every 30 minutes */
  marketAlert30m = {
    name: "Market Alerts (30m)",
    schedule: "*/30 * * * *",
    action: async () => {
      await analysisService.checkAlerts();
    },
  };
}

export default new AnalysisJob();
