import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const scoresSchema = new mongoose.Schema(
  {
    reputation: { type: Number, required: true },
    food: { type: Number, required: true },
    location: { type: Number, required: true },
    teachers: { type: Number, required: true },
    sportHall: { type: Number, required: true },
    activetyOutsideOfSchool: { type: Number, required: true },
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    userId: { type: String, required: true },
    schoolId: { type: String, required: true },
    comment: { type: String, default: "" },
    scores: { type: scoresSchema, required: true },
  },
  { versionKey: false }
);

export const Rating =
  mongoose.models.Rating || mongoose.model("Rating", ratingSchema);
