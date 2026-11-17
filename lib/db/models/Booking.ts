import { model, models, Schema, Types, type Model } from "mongoose";
import { DATE_REGEX } from "@/lib/validations/booking.schema";
import { TIME_REGEX } from "@/lib/validations/venue.schema";
import type {
  Booking as BookingDomain,
  BookingCustomer,
  BookingPayment,
} from "@/types/domain";

type BookingDocument = Omit<
  BookingDomain,
  "courtId" | "tournamentMatchId"
> & {
  courtId: Types.ObjectId;
  tournamentMatchId?: Types.ObjectId | null;
};

const bookingCustomerSchema = new Schema<BookingCustomer>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false },
);

const bookingPaymentSchema = new Schema<BookingPayment>(
  {
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    method: {
      type: String,
      default: "NONE",
      enum: ["CASH", "TRANSFER", "MERCADOPAGO", "NONE"],
    },
  },
  { _id: false },
);

const bookingSchema = new Schema<BookingDocument>(
  {
    courtId: {
      type: Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    date: { type: String, required: true, match: DATE_REGEX },
    startTime: { type: String, required: true, match: TIME_REGEX },
    endTime: { type: String, required: true, match: TIME_REGEX },
    type: {
      type: String,
      required: true,
      enum: ["CASUAL", "RECURRING", "TOURNAMENT", "BLOCKED"],
    },
    status: {
      type: String,
      default: "PENDING_PAYMENT",
      enum: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "COMPLETED",
        "CANCELLED",
      ],
      index: true,
    },
    customer: { type: bookingCustomerSchema },
    payment: { type: bookingPaymentSchema, required: true },
    tournamentMatchId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentMatch",
      default: null,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

bookingSchema.index(
  { courtId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      $or: [
        { status: "PENDING_PAYMENT" },
        { status: "CONFIRMED" },
        { status: "COMPLETED" },
      ],
    },
  },
);

export const BookingModel: Model<BookingDocument> =
  (models.Booking as Model<BookingDocument> | undefined) ??
  model<BookingDocument>("Booking", bookingSchema);

export default BookingModel;
