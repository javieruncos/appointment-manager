import { model, models, Schema, Types, type Model } from "mongoose";
import { DATE_REGEX } from "@/lib/validations/booking.schema";
import type {
  Tournament as TournamentDomain,
  TournamentRegistration,
} from "@/types/domain";

type TournamentDocument = Omit<TournamentDomain, "courtIds"> & {
  courtIds: Types.ObjectId[];
};

const tournamentRegistrationSchema = new Schema<TournamentRegistration>(
  {
    teamName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true },
    status: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "CONFIRMED", "REJECTED", "WITHDRAWN"],
    },
    registeredAt: { type: Date },
  },
  { _id: false },
);

const tournamentSchema = new Schema<TournamentDocument>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    format: {
      type: String,
      required: true,
      enum: ["LEAGUE", "SINGLE_ELIMINATION", "GROUPS_THEN_KNOCKOUT"],
    },
    status: {
      type: String,
      default: "DRAFT",
      enum: [
        "DRAFT",
        "REGISTRATION_OPEN",
        "REGISTRATION_CLOSED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
      ],
    },
    startDate: { type: String, required: true, match: DATE_REGEX },
    endDate: { type: String, required: true, match: DATE_REGEX },
    registrationDeadline: { type: String, match: DATE_REGEX },
    maxTeams: { type: Number, required: true, min: 2 },
    entryFee: { type: Number, default: 0, min: 0 },
    courtIds: {
      type: [Schema.Types.ObjectId],
      ref: "Court",
      default: [],
    },
    registrations: {
      type: [tournamentRegistrationSchema],
      default: [],
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ category: 1, status: 1 });

export const TournamentModel: Model<TournamentDocument> =
  (models.Tournament as Model<TournamentDocument> | undefined) ??
  model<TournamentDocument>("Tournament", tournamentSchema);

export default TournamentModel;
