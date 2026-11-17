import { z } from "zod";
import {
  DATE_REGEX,
  OBJECT_ID_REGEX,
} from "@/lib/validations/booking.schema";
import { TIME_REGEX } from "@/lib/validations/venue.schema";

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidTimeRange(startTime: string, endTime: string): boolean {
  const crossesMidnight = startTime > endTime && endTime <= "05:00";
  return startTime < endTime || crossesMidnight;
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
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

const tournamentFormatSchema = z.enum([
  "LEAGUE",
  "SINGLE_ELIMINATION",
  "GROUPS_THEN_KNOCKOUT",
]);

const tournamentStatusSchema = z.enum([
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

const registrationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "REJECTED",
  "WITHDRAWN",
]);

const matchPhaseSchema = z.enum([
  "LEAGUE",
  "GROUP",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
]);

const matchStatusSchema = z.enum([
  "PENDING_SCHEDULE",
  "SCHEDULED",
  "PLAYING",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
]);

const scheduleKeys = ["courtId", "date", "startTime", "endTime"] as const;

const tournamentRegistrationFields = {
  teamName: z.string().trim().min(1, "teamName es obligatorio"),
  contactName: z.string().trim().min(1, "contactName es obligatorio"),
  contactPhone: z.string().trim().min(1, "contactPhone es obligatorio"),
  contactEmail: z.string().trim().min(1).optional(),
  status: registrationStatusSchema,
  registeredAt: z.coerce.date().optional(),
};

export const tournamentRegistrationSchema = z
  .object({
    ...tournamentRegistrationFields,
    status: tournamentRegistrationFields.status.default("PENDING"),
  })
  .strict();

const updateTournamentRegistrationSchema = z
  .object(tournamentRegistrationFields)
  .strict();

const tournamentFields = {
  name: z.string().trim().min(1, "name es obligatorio"),
  category: z.string().trim().min(1, "category es obligatoria"),
  description: z.string().trim().min(1).optional(),
  format: tournamentFormatSchema,
  status: tournamentStatusSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  registrationDeadline: dateSchema.optional(),
  maxTeams: z
    .number()
    .int()
    .min(2, "maxTeams debe ser mayor o igual a 2"),
  entryFee: z.number().min(0, "entryFee debe ser >= 0"),
  courtIds: z.array(objectIdSchema),
  registrations: z.array(tournamentRegistrationSchema),
  notes: z.string().trim().min(1).optional(),
};

export const tournamentSchema = z
  .object({
    ...tournamentFields,
    status: tournamentFields.status.default("DRAFT"),
    entryFee: tournamentFields.entryFee.default(0),
    courtIds: tournamentFields.courtIds.default([]),
    registrations: tournamentFields.registrations.default([]),
  })
  .strict()
  .superRefine((tournament, ctx) => {
    if (tournament.endDate < tournament.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate no puede ser anterior a startDate",
      });
    }

    if (
      tournament.registrationDeadline &&
      tournament.registrationDeadline > tournament.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationDeadline"],
        message:
          "registrationDeadline no puede ser posterior a startDate",
      });
    }

    const seenTeams = new Set<string>();

    tournament.registrations.forEach((registration, index) => {
      const teamName = registration.teamName.toLowerCase();

      if (seenTeams.has(teamName)) {
        ctx.addIssue({
          code: "custom",
          path: ["registrations", index, "teamName"],
          message: "teamName está repetido en registrations",
        });
      }

      seenTeams.add(teamName);
    });
  });

export const updateTournamentSchema = z
  .object({
    ...tournamentFields,
    registrations: z.array(updateTournamentRegistrationSchema),
  })
  .partial()
  .strict()
  .superRefine((tournament, ctx) => {
    if (
      tournament.startDate &&
      tournament.endDate &&
      tournament.endDate < tournament.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "endDate no puede ser anterior a startDate",
      });
    }

    if (
      tournament.registrationDeadline &&
      tournament.startDate &&
      tournament.registrationDeadline > tournament.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationDeadline"],
        message:
          "registrationDeadline no puede ser posterior a startDate",
      });
    }

    if (tournament.registrations) {
      const seenTeams = new Set<string>();

      tournament.registrations.forEach((registration, index) => {
        const teamName = registration.teamName.toLowerCase();

        if (seenTeams.has(teamName)) {
          ctx.addIssue({
            code: "custom",
            path: ["registrations", index, "teamName"],
            message: "teamName está repetido en registrations",
          });
        }

        seenTeams.add(teamName);
      });
    }
  });

const tournamentMatchFields = {
  tournamentId: objectIdSchema,
  phase: matchPhaseSchema,
  groupName: z.string().trim().min(1).optional(),
  round: z.number().int().min(1, "round debe ser >= 1"),
  matchNumber: z
    .number()
    .int()
    .min(1, "matchNumber debe ser >= 1"),
  homeTeamName: z.string().trim().min(1, "homeTeamName es obligatorio"),
  awayTeamName: z.string().trim().min(1, "awayTeamName es obligatorio"),
  courtId: objectIdSchema.nullable().optional(),
  bookingId: objectIdSchema.nullable().optional(),
  date: dateSchema.nullable().optional(),
  startTime: timeSchema.nullable().optional(),
  endTime: timeSchema.nullable().optional(),
  status: matchStatusSchema,
  homeScore: z.number().int().min(0).nullable().optional(),
  awayScore: z.number().int().min(0).nullable().optional(),
  winnerTeamName: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().min(1).optional(),
};

export const tournamentMatchSchema = z
  .object({
    ...tournamentMatchFields,
    status: tournamentMatchFields.status.default("PENDING_SCHEDULE"),
  })
  .strict()
  .superRefine((match, ctx) => {
    const scheduleValues = scheduleKeys.map((key) => match[key]);
    const hasAnySchedule = scheduleValues.some((value) => value != null);
    const hasCompleteSchedule = scheduleValues.every(
      (value) => value != null,
    );

    if (hasAnySchedule && !hasCompleteSchedule) {
      scheduleKeys.forEach((key) => {
        if (match[key] == null) {
          ctx.addIssue({
            code: "custom",
            path: [key],
            message:
              "La programación debe incluir courtId, date, startTime y endTime",
          });
        }
      });
    }

    if (
      hasCompleteSchedule &&
      match.startTime &&
      match.endTime &&
      !isValidTimeRange(match.startTime, match.endTime)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message:
          "endTime debe ser posterior a startTime o cerrar hasta las 05:00",
      });
    }

    if (match.bookingId != null && !hasCompleteSchedule) {
      ctx.addIssue({
        code: "custom",
        path: ["bookingId"],
        message: "bookingId requiere una programación completa",
      });
    }

    if (
      match.homeTeamName.toLowerCase() ===
      match.awayTeamName.toLowerCase()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["awayTeamName"],
        message: "awayTeamName debe ser distinto de homeTeamName",
      });
    }

    if (match.phase === "GROUP" && !match.groupName) {
      ctx.addIssue({
        code: "custom",
        path: ["groupName"],
        message: "groupName es obligatorio para la fase GROUP",
      });
    }

    const hasHomeScore = match.homeScore != null;
    const hasAwayScore = match.awayScore != null;

    if (match.status === "FINISHED" && (!hasHomeScore || !hasAwayScore)) {
      ctx.addIssue({
        code: "custom",
        path: ["homeScore"],
        message: "Un partido FINISHED requiere homeScore y awayScore",
      });
    }

    if (hasHomeScore !== hasAwayScore) {
      ctx.addIssue({
        code: "custom",
        path: [hasHomeScore ? "awayScore" : "homeScore"],
        message: "homeScore y awayScore deben informarse juntos",
      });
    }

    if (match.winnerTeamName) {
      const teams = [
        match.homeTeamName.toLowerCase(),
        match.awayTeamName.toLowerCase(),
      ];

      if (!teams.includes(match.winnerTeamName.toLowerCase())) {
        ctx.addIssue({
          code: "custom",
          path: ["winnerTeamName"],
          message: "winnerTeamName debe ser uno de los equipos del partido",
        });
      }

      if (
        match.homeScore != null &&
        match.awayScore != null &&
        match.homeScore !== match.awayScore
      ) {
        const expectedWinner =
          match.homeScore > match.awayScore
            ? match.homeTeamName.toLowerCase()
            : match.awayTeamName.toLowerCase();

        if (match.winnerTeamName.toLowerCase() !== expectedWinner) {
          ctx.addIssue({
            code: "custom",
            path: ["winnerTeamName"],
            message:
              "winnerTeamName no coincide con el marcador del partido",
          });
        }
      }
    }
  });

export const updateTournamentMatchSchema = z
  .object(tournamentMatchFields)
  .partial()
  .strict()
  .superRefine((match, ctx) => {
    const presentScheduleKeys = scheduleKeys.filter((key) =>
      hasOwn(match, key),
    );

    if (presentScheduleKeys.length > 0) {
      if (presentScheduleKeys.length !== scheduleKeys.length) {
        scheduleKeys.forEach((key) => {
          if (!hasOwn(match, key)) {
            ctx.addIssue({
              code: "custom",
              path: [key],
              message:
                "La programación debe ser completa o nula en una actualización",
            });
          }
        });
      } else {
        const scheduleValues = scheduleKeys.map((key) => match[key]);
        const allNull = scheduleValues.every((value) => value == null);
        const allSet = scheduleValues.every((value) => value != null);

        if (!allNull && !allSet) {
          ctx.addIssue({
            code: "custom",
            path: ["courtId"],
            message:
              "La programación debe tener todos los campos o ninguno",
          });
        }

        if (
          allSet &&
          match.startTime &&
          match.endTime &&
          !isValidTimeRange(match.startTime, match.endTime)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["endTime"],
            message:
              "endTime debe ser posterior a startTime o cerrar hasta las 05:00",
          });
        }
      }
    }

    if (
      match.homeTeamName &&
      match.awayTeamName &&
      match.homeTeamName.toLowerCase() ===
        match.awayTeamName.toLowerCase()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["awayTeamName"],
        message: "awayTeamName debe ser distinto de homeTeamName",
      });
    }

    if (match.phase === "GROUP" && !match.groupName) {
      ctx.addIssue({
        code: "custom",
        path: ["groupName"],
        message: "groupName es obligatorio para la fase GROUP",
      });
    }

    const hasHomeScore = match.homeScore != null;
    const hasAwayScore = match.awayScore != null;

    if (hasHomeScore !== hasAwayScore) {
      ctx.addIssue({
        code: "custom",
        path: [hasHomeScore ? "awayScore" : "homeScore"],
        message: "homeScore y awayScore deben informarse juntos",
      });
    }

    if (
      match.winnerTeamName &&
      match.homeTeamName &&
      match.awayTeamName
    ) {
      const teams = [
        match.homeTeamName.toLowerCase(),
        match.awayTeamName.toLowerCase(),
      ];

      if (!teams.includes(match.winnerTeamName.toLowerCase())) {
        ctx.addIssue({
          code: "custom",
          path: ["winnerTeamName"],
          message: "winnerTeamName debe ser uno de los equipos del partido",
        });
      }

      if (
        match.homeScore != null &&
        match.awayScore != null &&
        match.homeScore !== match.awayScore
      ) {
        const expectedWinner =
          match.homeScore > match.awayScore
            ? match.homeTeamName.toLowerCase()
            : match.awayTeamName.toLowerCase();

        if (match.winnerTeamName.toLowerCase() !== expectedWinner) {
          ctx.addIssue({
            code: "custom",
            path: ["winnerTeamName"],
            message:
              "winnerTeamName no coincide con el marcador del partido",
          });
        }
      }
    }
  });

export type TournamentRegistrationInput = z.input<
  typeof tournamentRegistrationSchema
>;
export type TournamentRegistrationData = z.output<
  typeof tournamentRegistrationSchema
>;
export type TournamentInput = z.input<typeof tournamentSchema>;
export type TournamentData = z.output<typeof tournamentSchema>;
export type UpdateTournamentInput = z.input<typeof updateTournamentSchema>;
export type UpdateTournamentData = z.output<typeof updateTournamentSchema>;
export type TournamentMatchInput = z.input<typeof tournamentMatchSchema>;
export type TournamentMatchData = z.output<typeof tournamentMatchSchema>;
export type UpdateTournamentMatchInput = z.input<
  typeof updateTournamentMatchSchema
>;
export type UpdateTournamentMatchData = z.output<
  typeof updateTournamentMatchSchema
>;
