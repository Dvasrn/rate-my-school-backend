import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const schoolSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    schoolName: { type: String, required: true },
    location: { type: String, required: true },
    schoolType: {
      type: String,
      enum: ["Collage", "HighSchool", "University"],
      default: "HighSchool",
    },
    isSchoolPrivate: { type: Boolean, required: true },
  },
  { versionKey: false }
);

export const School =
  mongoose.models.School || mongoose.model("School", schoolSchema);
