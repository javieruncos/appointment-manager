import { model, models, Schema, Types, type Model } from "mongoose";
import { DATE_REGEX } from "@/lib/validations/booking.schema";
import { TIME_REGEX } from "@/lib/validations/venue.schema";
import type { TournamentMatch as TournamentMatchDomain } from "@/types/domain";

type TournamentMatchDocument = Omit<
  TournamentMatchDomain,
  "tournamentId" | "courtId" | "bookingId"
> & {
  tournamentId: Types.ObjectId;
  courtId?: Types.ObjectId | null;
  bookingId?: Types.ObjectId | null;
};

const tournamentMatchSchema = new Schema<TournamentMatchDocument>(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    phase: {
      type: String,
      required: true,
      enum: [
        "LEAGUE",
        "GROUP",
        "ROUND_OF_16",
        "QUARTER_FINAL",
        "SEMI_FINAL",
        "THIRD_PLACE",
        "FINAL",
      ],
    },
    groupName: { type: String, trim: true },
    round: { type: Number, required: true, min: 1 },
    matchNumber: { type: Number, required: true, min: 1 },
    homeTeamName: { type: String, required: true, trim: true },
    awayTeamName: { type: String, required: true, trim: true },
    courtId: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      default: null,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    date: { type: String, match: DATE_REGEX, default: null },
    startTime: { type: String, match: TIME_REGEX, default: null },
    endTime: { type: String, match: TIME_REGEX, default: null },
    status: {
      type: String,
      default: "PENDING_SCHEDULE",
      enum: [
        "PENDING_SCHEDULE",
        "SCHEDULED",
        "PLAYING",
        "FINISHED",
        "POSTPONED",
        "CANCELLED",
      ],
    },
    homeScore: { type: Number, min: 0, default: null },
    awayScore: { type: Number, min: 0, default: null },
    winnerTeamName: { type: String, trim: true, default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

tournamentMatchSchema.index({ tournamentId: 1, date: 1, startTime: 1 });
tournamentMatchSchema.index({ tournamentId: 1, phase: 1, round: 1 });
tournamentMatchSchema.index(
  { tournamentId: 1, matchNumber: 1 },
  { unique: true },
);

export const TournamentMatchModel: Model<TournamentMatchDocument> =
  (models.TournamentMatch as
    | Model<TournamentMatchDocument>
    | undefined) ??
  model<TournamentMatchDocument>(
    "TournamentMatch",
    tournamentMatchSchema,
  );

export default TournamentMatchModel;
