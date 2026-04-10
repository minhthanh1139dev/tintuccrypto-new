import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    body: { type: String, required: true },
    bodyVi: String,
  },
  { _id: false },
);

const DeepAnalysisSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "event_deep_dive",
        "macro_correlation",
        "narrative_report",
        "vietnam_focus",
        "monthly_report",
        "quarterly_report",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleVi: {
      type: String,
      trim: true,
    },

    sourceType: {
      type: String,
      enum: ["digest", "news_item"],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "sourceType",
    },

    sections: {
      type: [SectionSchema],
      required: true,
      validate: [(v) => v.length > 0, "At least one section is required"],
    },

    keyInsights: [String],
    risks: [String],
    opportunities: [String],
    outlook: String,
    coinsMentioned: [String],

    tierRequired: {
      type: String,
      enum: ["pro", "premium"],
      default: "pro",
    },
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
    collection: "deep_analyses",
  },
);

DeepAnalysisSchema.index({ sourceId: 1 });
DeepAnalysisSchema.index({ type: 1, createdAt: -1 });
DeepAnalysisSchema.index({ tierRequired: 1, status: 1 });

const DeepAnalysis = mongoose.model("DeepAnalysis", DeepAnalysisSchema);

export default DeepAnalysis;
