import mongoose from "mongoose";

const WeeklyMentionSchema = new mongoose.Schema(
  {
    weekStart: { type: Date, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false },
);

const NarrativeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameVi: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
    coins: [String],

    isTrending: {
      type: Boolean,
      default: false,
    },
    trendScore: {
      type: Number,
      default: 0,
    },
    firstSeen: Date,
    lastSeen: Date,

    weeklyMentions: {
      type: [WeeklyMentionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "narratives",
  },
);

NarrativeSchema.index({ slug: 1 }, { unique: true });
NarrativeSchema.index({ isTrending: 1, trendScore: -1 });
NarrativeSchema.index({ coins: 1 });

const Narrative = mongoose.model("Narrative", NarrativeSchema);

export default Narrative;
