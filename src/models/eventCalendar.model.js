import mongoose from "mongoose";

const EventCalendarSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        "fed_meeting",
        "cpi_release",
        "token_unlock",
        "halving",
        "mainnet_launch",
        "regulation",
        "conference",
        "vietnam_policy",
      ],
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    description: String,
    descriptionVi: String,
    impactLevel: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    coins: [String],
    region: {
      type: String,
      enum: ["global", "vietnam"],
      default: "global",
    },
    sourceUrl: {
      type: String,
      trim: true,
    },

    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
    },
  },
  {
    timestamps: true,
    collection: "events_calendar",
  },
);

EventCalendarSchema.index({ eventDate: 1 });
EventCalendarSchema.index({ type: 1, eventDate: 1 });
EventCalendarSchema.index({ region: 1, eventDate: 1 });

const EventCalendar = mongoose.model("EventCalendar", EventCalendarSchema);

export default EventCalendar;
