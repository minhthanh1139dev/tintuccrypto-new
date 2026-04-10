import mongoose from "mongoose";

const MarketSnapshotSchema = new mongoose.Schema(
  {
    fearGreedIndex: Number,
    fearGreedLabel: {
      type: String,
      enum: ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"],
    },
    btcDominance: Number,
    totalMarketCap: String,
    marketTrend: {
      type: String,
      enum: ["bullish", "bearish", "sideways"],
    },
  },
  { _id: false },
);

const DigestStatsSchema = new mongoose.Schema(
  {
    totalItems: { type: Number, default: 0 },
    highImpact: { type: Number, default: 0 },
    bullishCount: { type: Number, default: 0 },
    bearishCount: { type: Number, default: 0 },
    neutralCount: { type: Number, default: 0 },
    topCoins: [String],
  },
  { _id: false },
);

const DigestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["4h", "daily", "weekly", "monthly", "quarterly", "yearly"],
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    region: {
      type: String,
      enum: ["global", "vietnam", "all"],
      default: "global",
    },

    headline: String,
    headlineVi: String,
    overview: String,
    overviewVi: String,
    keyThemes: [String],
    topNarratives: [String],

    stats: DigestStatsSchema,
    marketSnapshot: MarketSnapshotSchema,

    parentDigestIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Digest",
      },
    ],

    status: {
      type: String,
      enum: ["generating", "published", "failed"],
      default: "generating",
    },
    modelUsed: String,
    apiCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiCallLog",
    },
  },
  {
    timestamps: true,
    collection: "digests",
  },
);

DigestSchema.index({ type: 1, periodStart: -1 });
DigestSchema.index({ type: 1, region: 1, periodStart: -1 });
DigestSchema.index({ status: 1, createdAt: -1 });
DigestSchema.index({ slug: 1 });

const Digest = mongoose.model("Digest", DigestSchema);

export default Digest;
