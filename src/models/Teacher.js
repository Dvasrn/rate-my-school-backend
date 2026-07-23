import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const teacherSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
    name: { type: String, required: true },
    schoolId: { type: String, required: true },
    subject: { type: String, required: true },
  },
  { versionKey: false }
);

export const Teacher =
  mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
