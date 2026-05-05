"use strict";

import CryptoAnalysis from "../../../models/cryptoAnalysis.model.js";

class CryptoAnalysisRepository {
  async create(data) {
    return await CryptoAnalysis.create(data);
  }

  async findLatest() {
    return await CryptoAnalysis.findOne().sort({ analyzed_at: -1 });
  }

  async findHistory({ limit = 24, sentiment, from, to }) {
    const filter = {};
    if (sentiment) filter.overall_sentiment = sentiment;
    if (from || to) {
      filter.analyzed_at = {};
      if (from) filter.analyzed_at.$gte = new Date(from);
      if (to) filter.analyzed_at.$lte = new Date(to);
    }

    return await CryptoAnalysis.find(filter)
      .sort({ analyzed_at: -1 })
      .limit(Number(limit))
      .select("-__v");
  }

  async getSentimentTrend(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await CryptoAnalysis.find({ analyzed_at: { $gte: since } })
      .sort({ analyzed_at: 1 })
      .select("analyzed_at overall_sentiment sentiment_score -_id");
  }

  async getTrendingAssetsAggregation(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await CryptoAnalysis.aggregate([
      { $match: { analyzed_at: { $gte: since } } },
      { $unwind: "$trending_assets" },
      {
        $group: {
          _id: "$trending_assets.symbol",
          total_mentions: { $sum: "$trending_assets.mentions" },
          positive: {
            $sum: {
              $cond: [{ $eq: ["$trending_assets.sentiment", "positive"] }, 1, 0],
            },
          },
          negative: {
            $sum: {
              $cond: [{ $eq: ["$trending_assets.sentiment", "negative"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total_mentions: -1 } },
      { $limit: 10 },
    ]);
  }
}

export default new CryptoAnalysisRepository();
