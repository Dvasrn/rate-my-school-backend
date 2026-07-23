import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const questionSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
    schoolId: { type: String, required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true },
    acceptedAnswerId: { type: String, default: null },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

export const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);
