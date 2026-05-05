"use strict";

import cryptoAnalysisService from "../services/analysis.service.js";
import { OK, CREATED, NOT_FOUND } from "../../../shared/utils/response.js";

class CryptoAnalysisController {
  async getLatest(req, res) {
    const latest = await cryptoAnalysisService.getLatest();
    if (!latest) throw new NOT_FOUND({ message: "No analysis found" });
    new OK({ data: latest }).send(res);
  }

  async getHistory(req, res) {
    const { limit, sentiment, from, to } = req.query;
    const history = await cryptoAnalysisService.getHistory({ limit, sentiment, from, to });
    new OK({ data: history }).send(res);
  }

  async getSentimentTrend(req, res) {
    const hours = Number(req.query.hours) || 24;
    const trend = await cryptoAnalysisService.getSentimentTrend(hours);
    new OK({ data: trend }).send(res);
  }

  async getTrendingAssets(req, res) {
    const hours = Number(req.query.hours) || 24;
    const assets = await cryptoAnalysisService.getTrendingAssets(hours);
    new OK({ data: assets }).send(res);
  }

  async triggerAnalysis(req, res) {
    const result = await cryptoAnalysisService.performHourlyAnalysis();
    new CREATED({ message: "Analysis triggered successfully", data: result }).send(res);
  }
}

export default new CryptoAnalysisController();
