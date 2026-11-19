"use client";

import { useBookingForm } from "@/hooks/use-booking-form";
import type { VenueView, CourtView } from "@/types/view";
import { formatDateLong } from "@/lib/utils/date";
import { Field } from "@/components/ui/field"; // O la ruta donde tengas tu componente Field
import { Select } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Wallet,
  CircleAlert
} from "lucide-react";

export type NewBookingFormProps = {
  venue: VenueView;
  courts: CourtView[];
  date: string;
  initialCourtId?: string;
  initialStartTime?: string;
  formId?: string;
  onCreated?: () => void;
  onRequestClose?: () => void;
};

export function NewBookingForm(props: NewBookingFormProps) {
  const { venue, courts, date, formId, initialCourtId, initialStartTime } = props;
  const { form, onSubmit, formError } = useBookingForm({
    venue,
    courts,
    date,
    initialCourtId,
    initialStartTime,
    onCreated: props.onCreated,
    onRequestClose: props.onRequestClose,
  });
  const { register, watch, formState: { errors } } = form;

  // Observamos valores actuales del formulario para mostrar en la sección de resumen
  const selectedCourtId = watch("courtId");
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  return (
    <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <section className="space-y-3">
        {/* Indicador de Fecha */}
        <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-1 px-3 py-2.5">
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            <CalendarDays aria-hidden="true" className="size-4 text-ink-faint" />
            {formatDateLong(date)}
          </span>
          <Badge tone="neutral">Fecha de la agenda</Badge>
        </div>

        {/* Cancha */}
        <Field label="Cancha" htmlFor="booking-court" required error={errors.courtId?.message}>
          <Select
            id="booking-court"
            {...register("courtId")}
          >
            {courts.map((court) => (
              <option key={court.id} value={court.id}>
                {court.name} · {court.format}
              </option>
            ))}
          </Select>
        </Field>

        {/* Horarios (Inicio y Fin) */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora Inicio" htmlFor="booking-start" required error={errors.startTime?.message}>
            <Input
              id="booking-start"
              type="time"
              {...register("startTime")}
            />
          </Field>
          <Field label="Hora Fin" htmlFor="booking-end" required error={errors.endTime?.message}>
            <Input
              id="booking-end"
              type="time"
              {...register("endTime")}
            />
          </Field>
        </div>
      </section>

      {/* Datos del Cliente */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">
          <User aria-hidden="true" className="size-3.5 text-ink-faint" />
          Cliente
        </h3>

        <Field label="Nombre" htmlFor="booking-name" required error={errors.customer?.name?.message}>
          <Input
            id="booking-name"
            {...register("customer.name")}
            placeholder="Nombre y apellido"
            autoComplete="name"
          />
        </Field>

        <Field label="Teléfono" htmlFor="booking-phone" required error={errors.customer?.phone?.message}>
          <Input
            id="booking-phone"
            type="tel"
            inputMode="tel"
            {...register("customer.phone")}
            placeholder="Teléfono de contacto"
            autoComplete="tel"
            leadingIcon={<Phone aria-hidden="true" className="size-4" />}
          />
        </Field>

        <Field label="Email" htmlFor="booking-email" hint="Opcional.">
          <Input
            id="booking-email"
            type="email"
            {...register("customer.email")}
            placeholder="cliente@correo.com"
            autoComplete="email"
          />
        </Field>
      </section>

      {/* Notas */}
      <section className="space-y-3">
        <Field label="Notas" htmlFor="booking-notes" hint="Indicaciones operativas para el turno.">
          <Textarea
            id="booking-notes"
            {...register("notes")}
            placeholder="Ej. necesita pelotas, llega 10 minutos antes..."
          />
        </Field>
      </section>

      {/* Resumen Informativo */}
      <section className="rounded-md border border-line bg-surface-1 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">
            <Wallet aria-hidden="true" className="size-3.5 text-ink-faint" />
            Resumen
          </h3>
          <Badge tone="amber">Seña pendiente</Badge>
        </div>

        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Cancha</dt>
            <dd className="text-right font-medium text-ink">
              {selectedCourt?.name ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Horario</dt>
            <dd className="font-mono text-right text-ink">
              {startTime && endTime ? `${startTime} – ${endTime}` : "—"}
            </dd>
          </div>
        </dl>

        <p className="mt-3 border-t border-line/70 pt-3 text-caption leading-relaxed text-ink-faint">
          La reserva se crea con la seña pendiente. El cálculo y cobro se procesan de forma segura en el servidor.
        </p>
      </section>

      {/* Error general del servidor */}
      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-coral/30 bg-coral/10 px-3 py-2.5 text-xs text-coral-bright"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <div className="pt-4 border-t border-line flex justify-end gap-2">
        <button
          type="button"
          onClick={props.onRequestClose}
          className="px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="px-4 py-2 text-xs font-medium bg-brand text-brand-foreground rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
        >
          {form.formState.isSubmitting ? "Guardando..." : "Crear reserva"}
        </button>
      </div>
    </form>
  );
}