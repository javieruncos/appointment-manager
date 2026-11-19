import mongoose, { Schema, type Model } from "mongoose";
import type { User } from "@/types/domain";

type UserDocument = User & {
  password: string;
};

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "STAFF"],
      default: "STAFF",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const UserModel: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
