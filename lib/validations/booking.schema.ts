import { z } from "zod";
import { TIME_REGEX } from "@/lib/validations/venue.schema";

export const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const timeSchema = z
  .string()
  .regex(TIME_REGEX, "Formato de hora inválido (HH:mm)");

const dateSchema = z
  .string()
  .regex(DATE_REGEX, "Formato de fecha inválido (YYYY-MM-DD)")
  .refine(isValidCalendarDate, "La fecha no existe en el calendario");

const objectIdSchema = z
  .string()
  .regex(OBJECT_ID_REGEX, "ObjectId inválido");

export const bookingCustomerSchema = z
  .object({
    name: z.string().trim().min(1, "name es obligatorio"),
    phone: z.string().trim().min(1, "phone es obligatorio"),
    email: z.string().trim().min(1).optional(),
  })
  .strict();

const bookingPaymentFields = {
  totalAmount: z.number().min(0, "totalAmount debe ser >= 0"),
  paidAmount: z.number().min(0, "paidAmount debe ser >= 0"),
  method: z.enum(["CASH", "TRANSFER", "MERCADOPAGO", "NONE"]),
};

export const bookingPaymentSchema = z
  .object({
    ...bookingPaymentFields,
    paidAmount: bookingPaymentFields.paidAmount.default(0),
    method: bookingPaymentFields.method.default("NONE"),
  })
  .strict();

const updateBookingPaymentSchema = z
  .object(bookingPaymentFields)
  .strict();

const bookingFields = {
  courtId: objectIdSchema,
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  type: z.enum(["CASUAL", "RECURRING", "TOURNAMENT", "BLOCKED"]),
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
  ]),
  customer: bookingCustomerSchema.optional(),
  payment: bookingPaymentSchema,
  tournamentMatchId: objectIdSchema.nullable().optional(),
  notes: z.string().trim().min(1).optional(),
};

export const bookingSchema = z
  .object({
    ...bookingFields,
    status: bookingFields.status.default("PENDING_PAYMENT"),
  })
  .strict()
  .superRefine((booking, ctx) => {
    // 1. Validar que la fecha y hora de inicio no sean en el pasado
    const bookingStart = new Date(`${booking.date}T${booking.startTime}:00`);
    if (bookingStart.getTime() < Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "No se pueden crear reservas en horarios que ya pasaron.",
      });
    }

    // 2. Validar cruce de medianoche y rangos de hora
    const crossesMidnight =
      booking.startTime > booking.endTime && booking.endTime <= "05:00";

    if (!(booking.startTime < booking.endTime || crossesMidnight)) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime debe ser posterior a startTime o cerrar hasta las 05:00",
      });
    }

    if (
      (booking.type === "CASUAL" || booking.type === "RECURRING") &&
      !booking.customer
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customer"],
        message: "customer es obligatorio para reservas CASUAL o RECURRING",
      });
    }

    if (booking.payment.paidAmount > booking.payment.totalAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["payment", "paidAmount"],
        message: "paidAmount no puede superar totalAmount",
      });
    }
  });

export const updateBookingSchema = z
  .object({
    ...bookingFields,
    payment: updateBookingPaymentSchema.optional(),
  })
  .partial()
  .strict()
  .superRefine((booking, ctx) => {
    if (booking.startTime && booking.endTime) {
      const crossesMidnight =
        booking.startTime > booking.endTime && booking.endTime <= "05:00";

      if (!(booking.startTime < booking.endTime || crossesMidnight)) {
        ctx.addIssue({
          code: "custom",
          path: ["endTime"],
          message:
            "endTime debe ser posterior a startTime o cerrar hasta las 05:00",
        });
      }
    }

    if (
      booking.type &&
      (booking.type === "CASUAL" || booking.type === "RECURRING") &&
      !booking.customer
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customer"],
        message: "customer es obligatorio para reservas CASUAL o RECURRING",
      });
    }

    if (
      booking.payment &&
      booking.payment.paidAmount > booking.payment.totalAmount
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["payment", "paidAmount"],
        message: "paidAmount no puede superar totalAmount",
      });
    }
  });

export type BookingCustomerInput = z.input<typeof bookingCustomerSchema>;
export type BookingCustomerData = z.output<typeof bookingCustomerSchema>;
export type BookingPaymentInput = z.input<typeof bookingPaymentSchema>;
export type BookingPaymentData = z.output<typeof bookingPaymentSchema>;
export type BookingInput = z.input<typeof bookingSchema>;
export type BookingData = z.output<typeof bookingSchema>;
export type UpdateBookingInput = z.input<typeof updateBookingSchema>;
export type UpdateBookingData = z.output<typeof updateBookingSchema>;
