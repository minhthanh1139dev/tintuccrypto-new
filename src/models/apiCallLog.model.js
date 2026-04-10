import mongoose from "mongoose";

const ApiCallLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    callType: {
      type: String,
      enum: [
        "4h_digest",
        "daily_digest",
        "weekly_summary",
        "monthly_summary",
        "quarterly_summary",
        "yearly_summary",
        "deep_analysis",
        "narrative_update",
        "event_scan",
        "fear_greed_pull",
        "translation",
        "custom",
      ],
      required: true,
    },
    region: {
      type: String,
      enum: ["global", "vietnam", "asia"],
    },

    tokensInput: { type: Number, default: 0 },
    tokensOutput: { type: Number, default: 0 },
    searchCalls: { type: Number, default: 0 },

    costTokens: { type: Number, default: 0 },
    costSearch: { type: Number, default: 0 },
    costTotal: { type: Number, default: 0 },

    durationMs: { type: Number },

    status: {
      type: String,
      enum: ["success", "failed", "partial"],
      required: true,
    },
    errorMessage: String,

    resultType: {
      type: String,
      enum: ["digest", "deep_analysis", "news_item", "narrative", "event_calendar", "fear_greed"],
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "api_call_logs",
  },
);

ApiCallLogSchema.index({ createdAt: -1 });
ApiCallLogSchema.index({ provider: 1, createdAt: -1 });
ApiCallLogSchema.index({ callType: 1, createdAt: -1 });
ApiCallLogSchema.index({ status: 1, createdAt: -1 });
ApiCallLogSchema.index({ resultType: 1, resultId: 1 });

const ApiCallLog = mongoose.model("ApiCallLog", ApiCallLogSchema);

export default ApiCallLog;
