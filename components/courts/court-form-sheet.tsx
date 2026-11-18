"use client";

import { useState, type FormEvent } from "react";
import {
  CircleAlert,
  Goal,
  Loader2,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import type { CourtView } from "@/types/view";
import {
  courtSchema,
  updateCourtSchema,
  type CourtInput,
} from "@/lib/validations/court.schema";
import { cn } from "@/lib/utils/cn";
import { getSurfaceLabel } from "@/lib/utils/schedule-ui";
import {
  createCourtAction,
  updateCourtAction,
} from "@/app/actions/court.actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Select } from "@/components/ui/input";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";

type CourtFormSheetProps = {
  court?: CourtView;
  onClose: () => void;
  onSaved: () => void;
};

type PricingDraft = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  pricePerHour: string;
};

type PricingDraftErrors = Partial<
  Record<"label" | "startTime" | "endTime" | "pricePerHour", string>
>;

type FormErrors = {
  name?: string;
  format?: string;
  surface?: string;
  isIndoor?: string;
  status?: string;
  pricing?: string;
  pricingRows: Record<string, PricingDraftErrors>;
};

type CourtIssue = {
  path: PropertyKey[];
  message: string;
};

const FORMATS: CourtView["format"][] = ["F5", "F7", "F8", "F11"];
const SURFACES: CourtView["surface"][] = [
  "SINTETICO",
  "CESPED",
  "CEMENTO",
];

const INDOOR_OPTIONS: SegmentedOption<"indoor" | "outdoor">[] = [
  { value: "indoor", label: "Techada" },
  { value: "outdoor", label: "Descubierta" },
];

const STATUS_OPTIONS: SegmentedOption<CourtView["status"]>[] = [
  { value: "ACTIVE", label: "Activa" },
  { value: "MAINTENANCE", label: "Inactiva" },
];

function makePricingDraft(
  id: string,
  pricing?: CourtView["pricing"][number],
): PricingDraft {
  return {
    id,
    label: pricing?.label ?? "",
    startTime: pricing?.startTime ?? "",
    endTime: pricing?.endTime ?? "",
    pricePerHour: pricing ? String(pricing.price) : "",
  };
}

function mapIssues(issues: CourtIssue[], rows: PricingDraft[]): FormErrors {
  const errors: FormErrors = { pricingRows: {} };

  for (const issue of issues) {
    const [field, rowIndex, key] = issue.path;

    if (field === "pricing") {
      if (typeof rowIndex === "number") {
        const row = rows[rowIndex];

        if (!row) {
          continue;
        }

        if (
          key === "label" ||
          key === "startTime" ||
          key === "endTime" ||
          key === "price"
        ) {
          const rowKey = key === "price" ? "pricePerHour" : key;
          const message =
            key === "price" && !row.pricePerHour.trim()
              ? "Ingresá un precio por hora."
              : issue.message;

          errors.pricingRows[row.id] = {
            ...errors.pricingRows[row.id],
            [rowKey]: message,
          };
        } else {
          errors.pricing = issue.message;
        }
      } else {
        errors.pricing = issue.message;
      }

      continue;
    }

    if (
      field === "name" ||
      field === "format" ||
      field === "surface" ||
      field === "isIndoor" ||
      field === "status"
    ) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Boolean(
    errors.name ||
      errors.format ||
      errors.surface ||
      errors.isIndoor ||
      errors.status ||
      errors.pricing ||
      Object.keys(errors.pricingRows).length > 0,
  );
}

export function CourtFormSheet({
  court,
  onClose,
  onSaved,
}: CourtFormSheetProps) {
  const formId = "court-form";

  const [name, setName] = useState(court?.name ?? "");
  const [format, setFormat] = useState<CourtView["format"]>(
    court?.format ?? "F5",
  );
  const [surface, setSurface] = useState<CourtView["surface"]>(
    court?.surface ?? "SINTETICO",
  );
  const [isIndoor, setIsIndoor] = useState(court?.isIndoor ?? false);
  const [status, setStatus] = useState<CourtView["status"]>(
    court?.status ?? "ACTIVE",
  );
  const [pricingRows, setPricingRows] = useState<PricingDraft[]>(() => {
    const initialPricing = court ? court.pricing : [undefined];

    return initialPricing.map((pricing, index) =>
      makePricingDraft(`pricing-${index}`, pricing),
    );
  });
  const [nextPricingId, setNextPricingId] = useState(() =>
    court ? court.pricing.length : 1,
  );
  const [errors, setErrors] = useState<FormErrors>({ pricingRows: {} });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const addPricingRow = () => {
    const id = `pricing-${nextPricingId}`;
    setNextPricingId((current) => current + 1);
    setPricingRows((current) => [...current, makePricingDraft(id)]);
  };

  const removePricingRow = (id: string) => {
    setPricingRows((current) => current.filter((row) => row.id !== id));
  };

  const updatePricingRow = (
    id: string,
    field: keyof Omit<PricingDraft, "id">,
    value: string,
  ) => {
    setPricingRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const buildPayload = (): CourtInput => ({
    name: name.trim(),
    format,
    surface,
    isIndoor,
    status,
    pricing: pricingRows.map((row) => ({
      label: row.label.trim(),
      startTime: row.startTime,
      endTime: row.endTime,
      price:
        row.pricePerHour.trim() === ""
          ? Number.NaN
          : Number(row.pricePerHour),
    })),
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);
    setErrors({ pricingRows: {} });

    const invalidPriceRows: Record<string, PricingDraftErrors> = {};

    for (const row of pricingRows) {
      const value = row.pricePerHour.trim();

      if (!value) {
        invalidPriceRows[row.id] = {
          pricePerHour: "Ingresá un precio por hora.",
        };
        continue;
      }

      if (!Number.isFinite(Number(value))) {
        invalidPriceRows[row.id] = {
          pricePerHour: "Ingresá un precio válido.",
        };
      }
    }

    if (Object.keys(invalidPriceRows).length > 0) {
      setErrors({ pricingRows: invalidPriceRows });
      setFormError("Revisá las tarifas ingresadas.");
      return;
    }

    const payload = buildPayload();
    const validation = court
      ? updateCourtSchema.safeParse(payload)
      : courtSchema.safeParse(payload);

    if (!validation.success) {
      const nextErrors = mapIssues(validation.error.issues, pricingRows);
      setErrors(nextErrors);
      setFormError(
        hasErrors(nextErrors)
          ? "Revisá los campos marcados."
          : "No se pudieron validar los datos de la cancha.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const result = court
        ? await updateCourtAction(court.id, payload)
        : await createCourtAction(payload);

      if (!result.success) {
        setFormError(
          result.error ?? "No se pudo guardar la cancha. Intentá nuevamente.",
        );
        return;
      }

      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la cancha. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open
      onClose={handleClose}
      eyebrow="Canchas y tarifas"
      title={court ? "Editar cancha" : "Nueva cancha"}
      description="Definí los datos operativos y las franjas horarias de precios."
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
            {isSubmitting
              ? "Guardando..."
              : court
                ? "Guardar cambios"
                : "Crear cancha"}
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
            <Goal aria-hidden="true" className="size-3.5 text-ink-faint" />
            Datos de la cancha
          </h2>

          <Field
            label="Nombre"
            htmlFor="court-name"
            required
            error={errors.name}
          >
            <Input
              id="court-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Cancha 1"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Formato"
              htmlFor="court-format"
              required
              error={errors.format}
            >
              <Select
                id="court-format"
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as CourtView["format"])
                }
                aria-invalid={Boolean(errors.format)}
              >
                {FORMATS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Superficie"
              htmlFor="court-surface"
              required
              error={errors.surface}
            >
              <Select
                id="court-surface"
                value={surface}
                onChange={(event) =>
                  setSurface(event.target.value as CourtView["surface"])
                }
                aria-invalid={Boolean(errors.surface)}
              >
                {SURFACES.map((option) => (
                  <option key={option} value={option}>
                    {getSurfaceLabel(option)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Techado" htmlFor="court-indoor">
              <div id="court-indoor">
                <SegmentedControl
                  options={INDOOR_OPTIONS}
                  value={isIndoor ? "indoor" : "outdoor"}
                  onChange={(value) => setIsIndoor(value === "indoor")}
                  ariaLabel="Tipo de techado"
                  size="sm"
                />
              </div>
            </Field>

            <Field
              label="Estado"
              htmlFor="court-status"
              error={errors.status}
            >
              <div id="court-status">
                <SegmentedControl
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={setStatus}
                  ariaLabel="Estado operativo"
                  size="sm"
                />
              </div>
            </Field>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-ink-muted">
              <Wallet aria-hidden="true" className="size-3.5 text-ink-faint" />
              Tarifas por franja
            </h2>

            <Button
              variant="outline"
              size="sm"
              onClick={addPricingRow}
              disabled={isSubmitting}
            >
              <Plus aria-hidden="true" className="size-3.5" />
              Agregar franja
            </Button>
          </div>

          {errors.pricing ? (
            <p className="text-xs text-coral-bright" role="alert">
              {errors.pricing}
            </p>
          ) : null}

          {pricingRows.length > 0 ? (
            <div className="space-y-3">
              {pricingRows.map((row, index) => {
                const rowErrors = errors.pricingRows[row.id];
                const hasRowError = Boolean(
                  rowErrors && Object.keys(rowErrors).length > 0,
                );

                return (
                  <div
                    key={row.id}
                    className={cn(
                      "space-y-3 rounded-md border bg-surface-1 p-3",
                      hasRowError ? "border-coral/30" : "border-line",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
                        Franja {index + 1}
                      </p>
                      <IconButton
                        type="button"
                        tone="danger"
                        aria-label={`Eliminar franja ${index + 1}`}
                        onClick={() => removePricingRow(row.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </IconButton>
                    </div>

                    <Field
                      label="Etiqueta"
                      htmlFor={`court-pricing-label-${row.id}`}
                      required
                      error={rowErrors?.label}
                    >
                      <Input
                        id={`court-pricing-label-${row.id}`}
                        value={row.label}
                        onChange={(event) =>
                          updatePricingRow(row.id, "label", event.target.value)
                        }
                        placeholder="Ej. Nocturna"
                        aria-invalid={Boolean(rowErrors?.label)}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Desde"
                        htmlFor={`court-pricing-start-${row.id}`}
                        required
                        error={rowErrors?.startTime}
                      >
                        <Input
                          id={`court-pricing-start-${row.id}`}
                          type="time"
                          value={row.startTime}
                          onChange={(event) =>
                            updatePricingRow(
                              row.id,
                              "startTime",
                              event.target.value,
                            )
                          }
                          aria-invalid={Boolean(rowErrors?.startTime)}
                        />
                      </Field>

                      <Field
                        label="Hasta"
                        htmlFor={`court-pricing-end-${row.id}`}
                        required
                        error={rowErrors?.endTime}
                      >
                        <Input
                          id={`court-pricing-end-${row.id}`}
                          type="time"
                          value={row.endTime}
                          onChange={(event) =>
                            updatePricingRow(
                              row.id,
                              "endTime",
                              event.target.value,
                            )
                          }
                          aria-invalid={Boolean(rowErrors?.endTime)}
                        />
                      </Field>
                    </div>

                    <Field
                      label="Precio por hora"
                      htmlFor={`court-pricing-price-${row.id}`}
                      required
                      error={rowErrors?.pricePerHour}
                    >
                      <Input
                        id={`court-pricing-price-${row.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        value={row.pricePerHour}
                        onChange={(event) =>
                          updatePricingRow(
                            row.id,
                            "pricePerHour",
                            event.target.value,
                          )
                        }
                        placeholder="0"
                        suffix="ARS/h"
                        aria-invalid={Boolean(rowErrors?.pricePerHour)}
                      />
                    </Field>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-line bg-surface-1 px-4 py-4 text-xs text-ink-muted">
              Sin franjas tarifarias. Podés guardar la cancha así y agregarlas
              más adelante.
            </p>
          )}
        </section>
      </form>
    </Sheet>
  );
}
