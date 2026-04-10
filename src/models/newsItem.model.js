import mongoose from "mongoose";

const NewsItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleVi: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
    },
    summaryVi: {
      type: String,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    sourceName: {
      type: String,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: ["web", "x_post", "telegram", "internal"],
      default: "web",
    },
    publishedAt: {
      type: Date,
    },

    region: {
      type: String,
      enum: ["global", "vietnam", "asia"],
      default: "global",
    },
    category: {
      type: String,
      enum: [
        "market",
        "macro",
        "regulation",
        "defi",
        "exchange",
        "project",
        "nft_gaming",
        "vietnam",
      ],
      required: true,
    },
    tags: [String],
    coins: [String],
    narratives: [String],

    sentiment: {
      type: String,
      enum: ["bullish", "bearish", "neutral"],
    },
    impact: {
      type: String,
      enum: ["high", "medium", "low"],
    },
    impactScore: {
      type: Number,
      min: 1,
      max: 10,
    },
    credibility: {
      type: String,
      enum: ["high", "medium", "low"],
    },

    status: {
      type: String,
      enum: ["collecting", "reviewing", "published", "archived"],
      default: "collecting",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    deepAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeepAnalysis",
    },
    apiCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiCallLog",
    },
  },
  {
    timestamps: true,
    collection: "news_items",
  },
);

NewsItemSchema.index({ sourceUrl: 1, sourceType: 1 }, { unique: true, sparse: true });
NewsItemSchema.index({ status: 1, createdAt: -1 });
NewsItemSchema.index({ region: 1, category: 1, createdAt: -1 });
NewsItemSchema.index({ coins: 1 });
NewsItemSchema.index({ narratives: 1 });
NewsItemSchema.index({ impactScore: -1 });
NewsItemSchema.index({ tags: 1 });
NewsItemSchema.index({ isFeatured: 1, createdAt: -1 });

const NewsItem = mongoose.model("NewsItem", NewsItemSchema);

export default NewsItem;
