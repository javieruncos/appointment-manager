"use client";

import { useState, type FormEvent } from "react";
import {
  CircleAlert,
  Loader2,
  MapPin,
  Trophy,
} from "lucide-react";
import type { CourtView } from "@/types/view";
import type {
  TournamentFormat,
  TournamentStatus,
} from "@/types/domain";
import {
  tournamentSchema,
  type TournamentInput,
} from "@/lib/validations/tournament.schema";
import {
  getTournamentFormatLabel,
  getTournamentStatusLabel,
} from "@/lib/utils/tournament-ui";
import { cn } from "@/lib/utils/cn";
import { createTournamentAction } from "@/app/actions/tournament.actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";

type TournamentFormSheetProps = {
  courts: CourtView[];
  onClose: () => void;
  onSaved: () => void;
};

type FormField =
  | "name"
  | "category"
  | "description"
  | "format"
  | "status"
  | "startDate"
  | "endDate"
  | "registrationDeadline"
  | "maxTeams"
  | "entryFee"
  | "courtIds"
  | "notes";

type FormErrors = Partial<Record<FormField, string>>;

type TournamentIssue = {
  path: PropertyKey[];
  message: string;
};

const FORM_FIELDS: FormField[] = [
  "name",
  "category",
  "description",
  "format",
  "status",
  "startDate",
  "endDate",
  "registrationDeadline",
  "maxTeams",
  "entryFee",
  "courtIds",
  "notes",
];

const FORMATS: TournamentFormat[] = [
  "LEAGUE",
  "SINGLE_ELIMINATION",
  "GROUPS_THEN_KNOCKOUT",
];

const STATUSES: TournamentStatus[] = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

function mapIssues(issues: TournamentIssue[]): FormErrors {
  const errors: FormErrors = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (
      typeof field === "string" &&
      FORM_FIELDS.includes(field as FormField)
    ) {
      errors[field as FormField] = issue.message;
    }
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function TournamentFormSheet({
  courts,
  onClose,
  onSaved,
}: TournamentFormSheetProps) {
  const formId = "tournament-form";

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("LEAGUE");
  const [status, setStatus] = useState<TournamentStatus>("DRAFT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [maxTeams, setMaxTeams] = useState("8");
  const [entryFee, setEntryFee] = useState("0");
  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const toggleCourt = (courtId: string) => {
    setCourtIds((current) =>
      current.includes(courtId)
        ? current.filter((id) => id !== courtId)
        : [...current, courtId],
    );
  };

  const buildPayload = (): TournamentInput => {
    const trimmedDescription = description.trim();
    const trimmedDeadline = registrationDeadline.trim();
    const trimmedNotes = notes.trim();

    return {
      name: name.trim(),
      category: category.trim(),
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      format,
      status,
      startDate,
      endDate,
      ...(trimmedDeadline
        ? { registrationDeadline: trimmedDeadline }
        : {}),
      maxTeams: Number(maxTeams),
      entryFee: entryFee.trim() === "" ? 0 : Number(entryFee),
      courtIds,
      registrations: [],
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    };
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);

    const nextErrors: FormErrors = {};
    const maxTeamsValue = Number(maxTeams);
    const entryFeeValue = Number(entryFee);

    if (!name.trim()) {
      nextErrors.name = "Ingresá el nombre del torneo.";
    }

    if (!category.trim()) {
      nextErrors.category = "Ingresá la categoría del torneo.";
    }

    if (!startDate) {
      nextErrors.startDate = "Seleccioná la fecha de inicio.";
    }

    if (!endDate) {
      nextErrors.endDate = "Seleccioná la fecha de finalización.";
    }

    if (
      !maxTeams.trim() ||
      !Number.isInteger(maxTeamsValue) ||
      maxTeamsValue < 2
    ) {
      nextErrors.maxTeams = "Ingresá una cantidad entera de 2 equipos o más.";
    }

    if (
      entryFee.trim() !== "" &&
      (!Number.isFinite(entryFeeValue) || entryFeeValue < 0)
    ) {
      nextErrors.entryFee = "Ingresá un monto válido, mayor o igual a 0.";
    }

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setFormError("Revisá los campos marcados.");
      return;
    }

    const payload = buildPayload();
    const validation = tournamentSchema.safeParse(payload);

    if (!validation.success) {
      const nextValidationErrors = mapIssues(validation.error.issues);
      setErrors(nextValidationErrors);
      setFormError(
        hasErrors(nextValidationErrors)
          ? "Revisá los campos marcados."
          : "No se pudieron validar los datos del torneo.",
      );
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const result = await createTournamentAction(payload);

      if (!result.success) {
        setFormError(
          result.error ??
            "No se pudo crear el torneo. Intentá nuevamente.",
        );
        return;
      }

      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo crear el torneo. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open
      onClose={handleClose}
      eyebrow="Competición"
      title="Nuevo torneo"
      description="Definí el formato, las fechas y las canchas del torneo."
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
            {isSubmitting ? "Creando..." : "Crear torneo"}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
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

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-ink-muted">
            <Trophy aria-hidden="true" className="size-3.5 text-ink-faint" />
            Datos del torneo
          </h2>

          <Field
            label="Nombre"
            htmlFor="tournament-name"
            required
            error={errors.name}
          >
            <Input
              id="tournament-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Copa Apertura"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          <Field
            label="Categoría"
            htmlFor="tournament-category"
            required
            error={errors.category}
          >
            <Input
              id="tournament-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Ej. Libre"
              autoComplete="off"
              aria-invalid={Boolean(errors.category)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Formato"
              htmlFor="tournament-format"
              required
              error={errors.format}
            >
              <Select
                id="tournament-format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as TournamentFormat)
                }
                aria-invalid={Boolean(errors.format)}
              >
                {FORMATS.map((option) => (
                  <option key={option} value={option}>
                    {getTournamentFormatLabel(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Estado"
              htmlFor="tournament-status"
              required
              error={errors.status}
            >
              <Select
                id="tournament-status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TournamentStatus)
                }
                aria-invalid={Boolean(errors.status)}
              >
                {STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {getTournamentStatusLabel(option)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Inicio"
              htmlFor="tournament-start-date"
              required
              error={errors.startDate}
            >
              <Input
                id="tournament-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={Boolean(errors.startDate)}
              />
            </Field>

            <Field
              label="Fin"
              htmlFor="tournament-end-date"
              required
              error={errors.endDate}
            >
              <Input
                id="tournament-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={Boolean(errors.endDate)}
              />
            </Field>
          </div>

          <Field
            label="Cierre de inscripción"
            htmlFor="tournament-deadline"
            hint="Opcional. No puede ser posterior al inicio."
            error={errors.registrationDeadline}
          >
            <Input
              id="tournament-deadline"
              type="date"
              value={registrationDeadline}
              onChange={(event) =>
                setRegistrationDeadline(event.target.value)
              }
              aria-invalid={Boolean(errors.registrationDeadline)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Equipos"
              htmlFor="tournament-max-teams"
              required
              error={errors.maxTeams}
            >
              <Input
                id="tournament-max-teams"
                type="number"
                min={2}
                step={1}
                inputMode="numeric"
                value={maxTeams}
                onChange={(event) => setMaxTeams(event.target.value)}
                aria-invalid={Boolean(errors.maxTeams)}
              />
            </Field>

            <Field
              label="Inscripción"
              htmlFor="tournament-entry-fee"
              error={errors.entryFee}
            >
              <Input
                id="tournament-entry-fee"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={entryFee}
                onChange={(event) => setEntryFee(event.target.value)}
                placeholder="0"
                suffix="ARS"
                aria-invalid={Boolean(errors.entryFee)}
              />
            </Field>
          </div>

          <Field
            label="Descripción"
            htmlFor="tournament-description"
            error={errors.description}
          >
            <Textarea
              id="tournament-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalles opcionales del torneo"
              aria-invalid={Boolean(errors.description)}
            />
          </Field>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-ink-muted">
            <MapPin aria-hidden="true" className="size-3.5 text-ink-faint" />
            Canchas del torneo
          </h2>

          <fieldset className="space-y-2">
            <legend className="sr-only">Canchas del torneo</legend>

            {courts.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {courts.map((court) => {
                  const isSelected = courtIds.includes(court.id);

                  return (
                    <button
                      key={court.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleCourt(court.id)}
                      className={cn(
                        "flex min-h-10 items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left text-xs transition-colors motion-reduce:transition-none",
                        isSelected
                          ? "border-lime/40 bg-lime/10 text-ink"
                          : "border-line bg-surface-1 text-ink-muted hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <span className="truncate">{court.name}</span>
                      <span className="shrink-0 font-mono text-caption text-ink-faint">
                        {court.format}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-sm border border-dashed border-line bg-surface-1 px-3 py-3 text-xs text-ink-muted">
                No hay canchas configuradas. Podés crear el torneo sin canchas
                y asignarlas más adelante.
              </p>
            )}

            {errors.courtIds ? (
              <p className="text-xs text-coral-bright" role="alert">
                {errors.courtIds}
              </p>
            ) : null}
          </fieldset>
        </section>

        <section className="space-y-3">
          <Field
            label="Notas"
            htmlFor="tournament-notes"
            error={errors.notes}
          >
            <Textarea
              id="tournament-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Condiciones, premios o aclaraciones"
              aria-invalid={Boolean(errors.notes)}
            />
          </Field>
        </section>
      </form>
    </Sheet>
  );
}
