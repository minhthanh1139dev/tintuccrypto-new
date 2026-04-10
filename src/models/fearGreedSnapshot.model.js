import mongoose from "mongoose";

const FearGreedSnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    label: {
      type: String,
      enum: ["Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed"],
      required: true,
    },
    vietnamSentiment: {
      type: String,
      enum: ["bullish", "bearish", "neutral"],
    },
  },
  {
    timestamps: true,
    collection: "fear_greed_snapshots",
  },
);

FearGreedSnapshotSchema.index({ date: -1 }, { unique: true });

const FearGreedSnapshot = mongoose.model("FearGreedSnapshot", FearGreedSnapshotSchema);

export default FearGreedSnapshot;
