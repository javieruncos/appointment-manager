import { model, models, Schema, type Model } from "mongoose";
import { TIME_REGEX } from "@/lib/validations/venue.schema";
import type {
  OperatingHour,
  VenueConfig as VenueConfigDomain,
} from "@/types/domain";

const operatingHourSchema = new Schema<OperatingHour>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    isOpen: { type: Boolean, required: true },
    openTime: { type: String, required: true, match: TIME_REGEX },
    closeTime: { type: String, required: true, match: TIME_REGEX },
  },
  { _id: false },
);

const venueConfigSchema = new Schema<VenueConfigDomain>(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "MAIN_VENUE",
      enum: ["MAIN_VENUE"],
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    slotDurationMinutes: {
      type: Number,
      required: true,
      default: 60,
      min: 30,
    },
    depositPercentage: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
      max: 100,
    },
    operatingHours: {
      type: [operatingHourSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export const VenueConfigModel: Model<VenueConfigDomain> =
  (models.VenueConfig as Model<VenueConfigDomain> | undefined) ??
  model<VenueConfigDomain>("VenueConfig", venueConfigSchema);

export default VenueConfigModel;
