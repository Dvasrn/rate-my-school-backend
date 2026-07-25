import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const achievementSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
    schoolId: { type: String, required: true },
    userId: { type: String, required: true },
    category: {
      type: String,
      enum: ["Olympiad", "Hackathon", "ICPC", "NBAA"],
      required: true,
    },
    title: { type: String, required: true },
    year: { type: Number, required: true },
    description: { type: String, default: "" },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model("Achievement", achievementSchema);
