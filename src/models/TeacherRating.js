import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const teacherScoresSchema = new mongoose.Schema(
  {
    communication: { type: Number, required: true },
    examDifficulty: { type: Number, required: true },
    teachingMethod: { type: Number, required: true },
  },
  { _id: false }
);

const teacherRatingSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
    teacherId: { type: String, required: true },
    userId: { type: String, required: true },
    comment: { type: String, default: "" },
    scores: { type: teacherScoresSchema, required: true },
  },
  { versionKey: false }
);

export const TeacherRating =
  mongoose.models.TeacherRating ||
  mongoose.model("TeacherRating", teacherRatingSchema);
