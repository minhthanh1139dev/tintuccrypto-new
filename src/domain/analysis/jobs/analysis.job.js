"use strict";

import analysisService from "../services/analysis.service.js";
import logger from "../../../shared/utils/logger.js";

class AnalysisJob {
  // CRONJOB 1: Phân tích tin tức — mỗi 4 tiếng
  periodicAnalysis = {
    name: "crypto-periodic-analysis",
    schedule: "0 */4 * * *", // Mỗi 4 tiếng
    action: async () => {
      await analysisService.performHourlyAnalysis();
    },
    runOnInit: false,
  };

  // CRONJOB 2: Kiểm tra giá & alert — mỗi 30 phút
  marketAlertCheck = {
    name: "crypto-market-alert",
    schedule: "*/30 * * * *", // Mỗi 30 phút
    action: async () => {
      const alertCount = await analysisService.checkMarketAlerts();
      if (alertCount > 0) {
        logger.info({ alertCount }, "Market alerts sent");
      }
    },
    runOnInit: false,
  };
}

export default new AnalysisJob();
