import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    storageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mime: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    kind: {
      type: String,
      enum: ["image", "document", "video", "file"],
      default: "file",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "files",
  },
);

FileSchema.index({ kind: 1, isPublic: 1 });
FileSchema.index({ createdAt: -1 });

const File = mongoose.model("File", FileSchema);

export default File;
