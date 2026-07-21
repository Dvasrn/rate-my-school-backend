import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const userSchoolSchema = new mongoose.Schema(
  {
    schoolId: { type: String, required: true },
    graduated: { type: Boolean, required: true },
    enrolledAt: { type: String, required: true },
    graduatedAt: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    username: { type: String, required: true },
    phoneNumber: { type: Number, required: true, unique: true },
    password: { type: String, required: true },
    birthDate: { type: String, default: "" },
    schools: { type: [userSchoolSchema], default: [] },
    favoriteSchoolIds: { type: [String], default: [] },
  },
  { versionKey: false }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
