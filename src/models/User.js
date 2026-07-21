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
    // Mixed: хуучин баримтууд native ObjectId, шинээр үүсгэсэн нь string UUID
    // тул хатуу String төрөл өгвөл findById хайлт зарим баримт дээр олдохгүй.
    _id: { type: mongoose.Schema.Types.Mixed, default: () => randomUUID() },
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
