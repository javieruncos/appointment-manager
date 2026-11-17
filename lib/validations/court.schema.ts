import { z } from "zod";
import { TIME_REGEX } from "@/lib/validations/venue.schema";

const timeSchema = z
  .string()
  .regex(TIME_REGEX, "Formato de hora inválido (HH:mm)");

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export const courtPricingSchema = z
  .object({
    label: z.string().trim().min(1, "label es obligatorio"),
    startTime: timeSchema,
    endTime: timeSchema,
    price: z.number().min(0, "price debe ser >= 0"),
  })
  .strict()
  .superRefine((pricing, ctx) => {
    const crossesMidnight =
      pricing.startTime > pricing.endTime && pricing.endTime <= "05:00";

    const isValid = pricing.startTime < pricing.endTime || crossesMidnight;

    if (!isValid) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime debe ser posterior a startTime o cerrar hasta las 05:00",
      });
    }
  });

const courtPricingListSchema = z
  .array(courtPricingSchema)
  .superRefine((pricing, ctx) => {
    const segments = pricing.flatMap((item, index) => {
      const start = toMinutes(item.startTime);
      const end = toMinutes(item.endTime);

      if (start < end) {
        return [{ index, start, end }];
      }

      if (end === 0) {
        return [{ index, start, end: 24 * 60 }];
      }

      return [
        { index, start, end: 24 * 60 },
        { index, start: 0, end },
      ];
    });

    segments.sort((a, b) => a.start - b.start);

    let previousEnd = -1;

    for (const segment of segments) {
      if (segment.start < previousEnd) {
        ctx.addIssue({
          code: "custom",
          path: [segment.index, "startTime"],
          message: "La franja tarifaria se solapa con otra franja",
        });
      }

      previousEnd = Math.max(previousEnd, segment.end);
    }
  });

const courtFields = {
  name: z.string().trim().min(1, "name es obligatorio"),
  format: z.enum(["F5", "F7", "F8", "F11"]),
  surface: z.enum(["SINTETICO", "CESPED", "CEMENTO"]),
  isIndoor: z.boolean(),
  status: z.enum(["ACTIVE", "MAINTENANCE"]),
  pricing: courtPricingListSchema,
};

export const courtSchema = z
  .object({
    ...courtFields,
    isIndoor: courtFields.isIndoor.default(false),
    status: courtFields.status.default("ACTIVE"),
  })
  .strict();

export const updateCourtSchema = z
  .object(courtFields)
  .partial()
  .strict();

export type CourtPricingInput = z.input<typeof courtPricingSchema>;
export type CourtPricingData = z.output<typeof courtPricingSchema>;
export type CourtInput = z.input<typeof courtSchema>;
export type CourtData = z.output<typeof courtSchema>;
export type UpdateCourtInput = z.input<typeof updateCourtSchema>;
export type UpdateCourtData = z.output<typeof updateCourtSchema>;
