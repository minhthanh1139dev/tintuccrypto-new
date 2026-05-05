"use strict";

import mongoose from "mongoose";

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const NewsItemSchema = new mongoose.Schema(
  {
    title: String,
    title_vi: String,
    summary_vi: String,
    url: { type: String, default: "" },
    source: String,
    published_at: String,
    impact: { type: String, enum: ["high", "medium", "low"] },
    affected_assets: [String],
    sentiment: { type: String, enum: ["positive", "negative", "neutral"] },
    category: {
      type: String,
      enum: ["market", "macro", "regulation", "onchain", "other"],
      default: "other",
    },
  },
  { _id: false },
);

const PriceLevelSchema = new mongoose.Schema(
  {
    key_support: [String],
    key_resistance: [String],
    technical_bias: String,
  },
  { _id: false },
);

const KeyEventSchema = new mongoose.Schema(
  {
    title: String,
    detail: String,
    impact: { type: String, enum: ["high", "medium", "low"] },
    affected_assets: [String],
    sentiment: { type: String, enum: ["positive", "negative", "neutral"] },
    source_url: { type: String, default: "" },
  },
  { _id: false },
);

const AssetAnalysisSchema = new mongoose.Schema(
  {
    price_trend: String,
    funding_interpretation: String,
    oi_interpretation: String,
    ls_interpretation: String,
  },
  { _id: false },
);

const MacroFactorSchema = new mongoose.Schema(
  {
    factor: String,
    status: String,
    crypto_impact: { type: String, enum: ["positive", "negative", "neutral"] },
    detail: String,
  },
  { _id: false },
);

const TrendingAssetSchema = new mongoose.Schema(
  {
    symbol: { type: String, uppercase: true },
    mentions: { type: Number, default: 0 },
    sentiment: { type: String, enum: ["positive", "negative", "neutral"] },
    reason: String,
  },
  { _id: false },
);

const RiskSignalSchema = new mongoose.Schema(
  {
    signal: String,
    severity: { type: String, enum: ["high", "medium", "low"] },
    source: String,
  },
  { _id: false },
);

const OpportunitySchema = new mongoose.Schema(
  {
    opportunity: String,
    confidence: { type: String, enum: ["high", "medium", "low"] },
    basis: String,
  },
  { _id: false },
);

const CoinSnapshotSchema = new mongoose.Schema(
  {
    price: String,
    priceChangePercent: String,
    quoteVolume: String,
    highPrice: String,
    lowPrice: String,
    fundingRate: String,
    openInterest: String,
    longShortRatio: String,
  },
  { _id: false },
);

const MarketSnapshotSchema = new mongoose.Schema(
  {
    btc: CoinSnapshotSchema,
    eth: CoinSnapshotSchema,
    snapshot_at: String,
  },
  { _id: false },
);

// ── Main Schema ──────────────────────────────────────────────────────────────

const CryptoAnalysisSchema = new mongoose.Schema(
  {
    analyzed_at: { type: Date, required: true, index: true },
    period: { type: String, default: "2 giờ qua" },

    overall_sentiment: {
      type: String,
      enum: ["bullish", "bearish", "neutral"],
      index: true,
    },
    sentiment_score: { type: Number, min: -1, max: 1 },
    confidence: { type: String, enum: ["high", "medium", "low"] },

    market_summary: String,

    news: [NewsItemSchema],
    key_events: [KeyEventSchema], // Keeping for compatibility

    key_price_levels: {
      btc: PriceLevelSchema,
      eth: PriceLevelSchema,
    },

    market_data_analysis: {
      btc: AssetAnalysisSchema,
      eth: AssetAnalysisSchema,
      correlation_note: String,
    },

    macro_factors: [MacroFactorSchema],
    trending_assets: [TrendingAssetSchema],
    risk_signals: [RiskSignalSchema],
    opportunities: [OpportunitySchema],

    news_count: { type: Number, default: 0 },
    data_sources: [String],
    note: String,

    market_snapshot: MarketSnapshotSchema,
  },
  {
    timestamps: true,
    collection: "crypto_analyses",
  },
);

CryptoAnalysisSchema.index({ analyzed_at: -1 });
CryptoAnalysisSchema.index({ overall_sentiment: 1, analyzed_at: -1 });

const CryptoAnalysis = mongoose.model("CryptoAnalysis", CryptoAnalysisSchema);

export default CryptoAnalysis;
