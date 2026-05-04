import mongoose from "mongoose";

const NewsItemSchema = new mongoose.Schema({
  title: String,
  title_vi: String,
  summary_vi: String,
  url: String,
  source: String,
  published_at: String,
  impact: String,
  affected_assets: [String],
  sentiment: String,
  category: String,
}, { _id: false });

const PriceLevelSchema = new mongoose.Schema({
  key_support: [String],
  key_resistance: [String],
  technical_bias: String,
}, { _id: false });

const MarketDataAnalysisSchema = new mongoose.Schema({
  price_trend: String,
  funding_interpretation: String,
  oi_interpretation: String,
  ls_interpretation: String,
}, { _id: false });

const MarketSnapshotSchema = new mongoose.Schema({
  price: String,
  priceChangePercent: String,
  quoteVolume: String,
  highPrice: String,
  lowPrice: String,
  fundingRate: String,
  openInterest: String,
  longShortRatio: String,
}, { _id: false });

const MarketAnalysisSchema = new mongoose.Schema(
  {
    analyzed_at: { type: Date, required: true },
    period: { type: String, default: "4h" },
    overall_sentiment: { type: String, required: true },
    sentiment_score: { type: Number },
    confidence: { type: String },

    market_summary: { type: String, required: true },

    news: [NewsItemSchema],

    key_price_levels: {
      btc: PriceLevelSchema,
      eth: PriceLevelSchema,
    },

    market_data_analysis: {
      btc: MarketDataAnalysisSchema,
      eth: MarketDataAnalysisSchema,
      correlation_note: String,
    },

    macro_factors: [mongoose.Schema.Types.Mixed],
    risk_signals: [mongoose.Schema.Types.Mixed],
    opportunities: [mongoose.Schema.Types.Mixed],

    news_count: Number,
    data_sources: [String],
    note: String,

    market_snapshot: {
      btc: MarketSnapshotSchema,
      eth: MarketSnapshotSchema,
      snapshot_at: Date,
    },

    apiCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiCallLog",
    },
  },
  {
    timestamps: true,
    collection: "market_analyses",
  }
);

MarketAnalysisSchema.index({ analyzed_at: -1 });
MarketAnalysisSchema.index({ overall_sentiment: 1 });

const MarketAnalysis = mongoose.model("MarketAnalysis", MarketAnalysisSchema);

export default MarketAnalysis;
