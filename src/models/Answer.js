import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const answerSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
    questionId: { type: String, required: true },
    userId: { type: String, required: true },
    text: { type: String, required: true },
    upvotedBy: { type: [String], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { versionKey: false }
);

export const Answer =
  mongoose.models.Answer || mongoose.model("Answer", answerSchema);
