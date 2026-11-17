import { model, models, Schema, type Model } from "mongoose";
import { TIME_REGEX } from "@/lib/validations/venue.schema";
import type { Court as CourtDomain, CourtPricing } from "@/types/domain";

const courtPricingSchema = new Schema<CourtPricing>(
  {
    label: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, match: TIME_REGEX },
    endTime: { type: String, required: true, match: TIME_REGEX },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const courtSchema = new Schema<CourtDomain>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    format: {
      type: String,
      required: true,
      enum: ["F5", "F7", "F8", "F11"],
    },
    surface: {
      type: String,
      required: true,
      enum: ["SINTETICO", "CESPED", "CEMENTO"],
    },
    isIndoor: { type: Boolean, default: false },
    status: {
      type: String,
      default: "ACTIVE",
      enum: ["ACTIVE", "MAINTENANCE"],
    },
    pricing: {
      type: [courtPricingSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export const CourtModel: Model<CourtDomain> =
  (models.Court as Model<CourtDomain> | undefined) ??
  model<CourtDomain>("Court", courtSchema);

export default CourtModel;
