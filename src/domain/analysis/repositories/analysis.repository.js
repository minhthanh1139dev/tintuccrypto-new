"use strict";

import MarketAnalysis from "../../../models/marketAnalysis.model.js";

class AnalysisRepository {
  async create(data) {
    return await MarketAnalysis.create(data);
  }

  async findLatest() {
    return await MarketAnalysis.findOne().sort({ analyzed_at: -1 });
  }

  async findHistory({ limit = 10, page = 1 } = {}) {
    const skip = (page - 1) * limit;
    return await MarketAnalysis.find()
      .sort({ analyzed_at: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findById(id) {
    return await MarketAnalysis.findById(id);
  }
}

export default new AnalysisRepository();
