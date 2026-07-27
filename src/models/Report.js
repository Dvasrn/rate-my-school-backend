import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const reportSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
    ratingId: { type: String, required: true },
    userId: { type: String, required: true },
    reason: { type: String, enum: ["Spam", "Fake"], required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

export const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);
