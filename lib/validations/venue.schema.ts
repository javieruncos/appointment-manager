import { z } from "zod";

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeSchema = z
  .string()
  .regex(TIME_REGEX, "Formato de hora inválido (HH:mm)");

export const operatingHourSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    openTime: timeSchema,
    closeTime: timeSchema,
  })
  .strict()
  .superRefine((hour, ctx) => {
    if (!hour.isOpen) {
      return;
    }

    const crossesMidnight = hour.closeTime <= "05:00";
    const isValid =
      hour.openTime < hour.closeTime ||
      (hour.openTime > hour.closeTime && crossesMidnight);

    if (!isValid) {
      ctx.addIssue({
        code: "custom",
        path: ["closeTime"],
        message:
          "closeTime debe ser posterior a openTime o cerrar hasta las 05:00",
      });
    }
  });

export const operatingHoursSchema = z
  .array(operatingHourSchema)
  .superRefine((hours, ctx) => {
    const seen = new Set<number>();

    hours.forEach((hour, index) => {
      if (seen.has(hour.dayOfWeek)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "dayOfWeek"],
          message: "dayOfWeek está repetido en operatingHours",
        });
      }
      seen.add(hour.dayOfWeek);
    });
  });

const venueConfigFields = {
  name: z.string().trim().min(1, "name es obligatorio"),
  address: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  slotDurationMinutes: z
    .number()
    .int()
    .min(30, "slotDurationMinutes debe ser >= 30"),
  depositPercentage: z
    .number()
    .min(0)
    .max(100, "depositPercentage debe estar entre 0 y 100"),
  operatingHours: operatingHoursSchema,
};

export const venueConfigSchema = z
  .object({
    singletonKey: z.literal("MAIN_VENUE").default("MAIN_VENUE"),
    ...venueConfigFields,
    slotDurationMinutes: venueConfigFields.slotDurationMinutes.default(60),
    depositPercentage: venueConfigFields.depositPercentage.default(30),
  })
  .strict();

export const updateVenueConfigSchema = z
  .object(venueConfigFields)
  .partial()
  .strict();

export type VenueConfigInput = z.input<typeof venueConfigSchema>;
export type VenueConfigData = z.output<typeof venueConfigSchema>;
export type UpdateVenueConfigInput = z.input<typeof updateVenueConfigSchema>;
export type UpdateVenueConfigData = z.output<typeof updateVenueConfigSchema>;
