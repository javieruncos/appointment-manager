"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  CircleAlert,
  Loader2,
  MapPin,
} from "lucide-react";
import type { MatchView } from "@/types/view";
import {
  updateTournamentMatchSchema,
  type UpdateTournamentMatchInput,
} from "@/lib/validations/tournament.schema";
import { getMatchStatusLabel } from "@/lib/utils/schedule-ui";
import {
  formatMatchSchedule,
  getMatchStatusTone,
} from "@/lib/utils/tournament-ui";
import { updateTournamentMatchScoreAction } from "@/app/actions/tournament.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";

type MatchScoreSheetProps = {
  match: MatchView;
  tournamentName: string;
  courtName?: string;
  onClose: () => void;
  onSaved: () => void;
};

type FormField = "homeScore" | "awayScore" | "status";

type FormErrors = Partial<Record<FormField, string>>;

type MatchIssue = {
  path: PropertyKey[];
  message: string;
};

const STATUSES: MatchView["status"][] = [
  "PENDING_SCHEDULE",
  "SCHEDULED",
  "PLAYING",
  "FINISHED",
  "POSTPONED",
  "CANCELLED",
];

function mapIssues(issues: MatchIssue[]): FormErrors {
  const errors: FormErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (
      field === "homeScore" ||
      field === "awayScore" ||
      field === "status"
    ) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function MatchScoreSheet({
  match,
  tournamentName,
  courtName,
  onClose,
  onSaved,
}: MatchScoreSheetProps) {
  const formId = "match-score-form";

  const [homeScore, setHomeScore] = useState(
    match.homeScore !== null && match.homeScore !== undefined
      ? String(match.homeScore)
      : "",
  );
  const [awayScore, setAwayScore] = useState(
    match.awayScore !== null && match.awayScore !== undefined
      ? String(match.awayScore)
      : "",
  );
  const [status, setStatus] = useState<MatchView["status"]>(match.status);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const buildPayload = (): UpdateTournamentMatchInput => ({
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
    status,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);

    const nextErrors: FormErrors = {};
    const homeScoreValue = Number(homeScore);
    const awayScoreValue = Number(awayScore);

    if (!homeScore.trim()) {
      nextErrors.homeScore = "Ingresá los goles del equipo local.";
    } else if (
      !Number.isInteger(homeScoreValue) ||
      homeScoreValue < 0
    ) {
      nextErrors.homeScore = "Ingresá un marcador entero, mayor o igual a 0.";
    }

    if (!awayScore.trim()) {
      nextErrors.awayScore = "Ingresá los goles del equipo visitante.";
    } else if (
      !Number.isInteger(awayScoreValue) ||
      awayScoreValue < 0
    ) {
      nextErrors.awayScore = "Ingresá un marcador entero, mayor o igual a 0.";
    }

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setFormError("Revisá los marcadores ingresados.");
      return;
    }

    const payload = buildPayload();
    const validation = updateTournamentMatchSchema.safeParse(payload);

    if (!validation.success) {
      const nextValidationErrors = mapIssues(validation.error.issues);
      setErrors(nextValidationErrors);
      setFormError(
        hasErrors(nextValidationErrors)
          ? "Revisá los campos marcados."
          : "No se pudo validar el resultado del partido.",
      );
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await updateTournamentMatchScoreAction(
        match.id,
        payload,
      );

      if (!result.success) {
        setFormError(
          result.error ??
            "No se pudo actualizar el resultado. Intentá nuevamente.",
        );
        return;
      }

      if (!result.data) {
        setFormError(
          "No se encontró el partido. Actualizá la página e intentá nuevamente.",
        );
        return;
      }

      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el resultado. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open
      onClose={handleClose}
      eyebrow="Torneo"
      title="Cargar resultado"
      description={`${tournamentName} · Partido ${match.matchNumber}`}
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            className="flex-[2]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            {isSubmitting ? "Guardando..." : "Guardar resultado"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {formError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-sm border border-coral/30 bg-coral/10 px-3 py-2.5 text-xs text-coral-bright"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{formError}</span>
          </div>
        ) : null}

        <div className="rounded-md border border-line bg-surface-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
                Partido {match.matchNumber}
              </p>
              <p className="mt-1 break-words text-sm font-semibold tracking-tight text-ink">
                {match.homeTeamName}{" "}
                <span className="text-caption uppercase tracking-widest text-ink-faint">
                  vs
                </span>{" "}
                {match.awayTeamName}
              </p>
            </div>
            <Badge tone={getMatchStatusTone(match.status)} className="shrink-0">
              {getMatchStatusLabel(match.status)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-faint"
              />
              {formatMatchSchedule(match)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-faint"
              />
              {courtName ?? "Sin cancha"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Goles local"
            htmlFor="match-home-score"
            required
            error={errors.homeScore}
          >
            <Input
              id="match-home-score"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              placeholder="0"
              aria-invalid={Boolean(errors.homeScore)}
            />
          </Field>

          <Field
            label="Goles visitante"
            htmlFor="match-away-score"
            required
            error={errors.awayScore}
          >
            <Input
              id="match-away-score"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              placeholder="0"
              aria-invalid={Boolean(errors.awayScore)}
            />
          </Field>
        </div>

        <Field
          label="Estado"
          htmlFor="match-status"
          required
          error={errors.status}
        >
          <Select
            id="match-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as MatchView["status"])
            }
            aria-invalid={Boolean(errors.status)}
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {getMatchStatusLabel(option)}
              </option>
            ))}
          </Select>
        </Field>

        <p className="text-xs leading-relaxed text-ink-faint">
          El ganador se calcula automáticamente cuando el partido finaliza con
          un marcador distinto. Cargá ambos marcadores para guardar el estado.
        </p>
      </form>
    </Sheet>
  );
}
