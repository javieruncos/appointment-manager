"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CircleAlert,
  Clock,
  Loader2,
  Phone,
  User,
  Wallet,
} from "lucide-react";
import type { BookingInput } from "@/lib/validations/booking.schema";
import type { BookingView, CourtView, MatchView, VenueView } from "@/types/view";
import {
  calculateBookingTotal,
  calculateDeposit,
  formatDuration,
  getAvailabilitySlots,
  getCourtBookableWindow,
  getDurationOptions,
  getFormatLabel,
  getRangeRate,
  getVenueDayStatus,
  minutesToTime,
  timeToMinutes,
} from "@/lib/utils/schedule-ui";
import { formatDateLong } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { createBookingAction } from "@/app/actions/booking.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";

type NewBookingSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  venue: VenueView;
  courts: CourtView[];
  bookings: BookingView[];
  matches: MatchView[];
  date: string;
  initialCourtId?: string;
  initialStartTime?: string;
};

type FormErrors = {
  name?: string;
  phone?: string;
  slot?: string;
};

export function NewBookingSheet({
  open,
  onClose,
  onCreated,
  venue,
  courts,
  bookings,
  matches,
  date,
  initialCourtId,
  initialStartTime,
}: NewBookingSheetProps) {
  const formId = "new-booking-form";

  const [courtId, setCourtId] = useState(initialCourtId ?? courts[0]?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    venue.slotDurationMinutes,
  );
  const [startTime, setStartTime] = useState(initialStartTime ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCourt = useMemo(
    () => courts.find((court) => court.id === courtId) ?? courts[0] ?? null,
    [courts, courtId],
  );

  const effectiveCourtId = selectedCourt?.id ?? "";

  const slots = useMemo(
    () =>
      selectedCourt
        ? getAvailabilitySlots(
            selectedCourt,
            venue,
            date,
            durationMinutes,
            bookings,
            matches,
          )
        : [],
    [selectedCourt, venue, date, durationMinutes, bookings, matches],
  );

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.available),
    [slots],
  );

  const selectedSlot =
    availableSlots.find((slot) => slot.startTime === startTime) ??
    availableSlots[0];

  const durationOptions = useMemo<SegmentedOption<string>[]>(
    () =>
      getDurationOptions(venue).map((minutes) => ({
        value: String(minutes),
        label: formatDuration(minutes),
      })),
    [venue],
  );

  const bookableWindow = selectedCourt
    ? getCourtBookableWindow(selectedCourt, venue, date)
    : null;

  const dayStatus = getVenueDayStatus(venue, date);

  const rate =
    selectedCourt && selectedSlot
      ? getRangeRate(selectedCourt, selectedSlot.start, durationMinutes)
      : null;

  const total =
    rate === null ? null : calculateBookingTotal(rate, durationMinutes);

  const deposit =
    total === null
      ? null
      : calculateDeposit(total, venue.depositPercentage);

  const canSubmit =
    !isSubmitting &&
    selectedCourt !== null &&
    selectedSlot !== undefined &&
    total !== null;

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors: FormErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Ingresá el nombre del cliente.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Ingresá un teléfono de contacto.";
    }

    if (!selectedCourt || !selectedSlot || total === null) {
      nextErrors.slot = "Seleccioná un horario disponible.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!selectedCourt || !selectedSlot || total === null) {
      return;
    }

    const payload: BookingInput = {
      courtId: selectedCourt.id,
      date,
      startTime: selectedSlot.startTime,
      endTime: minutesToTime(timeToMinutes(selectedSlot.startTime) + durationMinutes),
      type: "CASUAL",
      status: "PENDING_PAYMENT",
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      },
      payment: {
        totalAmount: total,
        paidAmount: 0,
        method: "NONE",
      },
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await createBookingAction(payload);

      if (!result.success) {
        setFormError(
          result.error ?? "No se pudo crear la reserva. Intentá nuevamente.",
        );
        return;
      }

      onCreated();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "No se pudo crear la reserva. Intentá nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      eyebrow="Turno casual"
      title="Nueva reserva"
      description={`${venue.name} · ${formatDateLong(date)}`}
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-muted">Seña estimada</span>
            <span className="font-mono font-semibold text-ink">
              {deposit === null ? "—" : formatCurrency(deposit)}
            </span>
          </div>
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
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              {isSubmitting ? "Creando..." : "Crear reserva"}
            </Button>
          </div>
        </div>
      }
    >
      {courts.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-surface-1 px-4 py-5 text-sm text-ink-muted">
          No hay canchas activas para crear una reserva.
        </p>
      ) : (
        <form id={formId} onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-1 px-3 py-2.5">
              <span className="flex items-center gap-2 text-xs text-ink-muted">
                <CalendarDays aria-hidden="true" className="size-4 text-ink-faint" />
                {formatDateLong(date)}
              </span>
              <Badge tone="neutral">Fecha de la agenda</Badge>
            </div>

            <Field label="Cancha" htmlFor="booking-court" required>
              <Select
                id="booking-court"
                value={effectiveCourtId}
                onChange={(event) => setCourtId(event.target.value)}
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} · {court.format} · {getFormatLabel(court.format)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Duración"
              htmlFor="booking-duration"
              hint="Los horarios se ajustan a la duración elegida."
            >
              <div id="booking-duration">
                <SegmentedControl
                  options={durationOptions}
                  value={String(durationMinutes)}
                  onChange={(value) => setDurationMinutes(Number(value))}
                  ariaLabel="Duración de la reserva"
                  size="sm"
                />
              </div>
            </Field>

            <Field
              label="Inicio"
              htmlFor="booking-start"
              required
              error={errors.slot}
            >
              {availableSlots.length === 0 ? (
                <div className="flex items-start gap-2 rounded-sm border border-amber/25 bg-amber/10 px-3 py-2.5 text-xs text-amber-bright">
                  <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {dayStatus === "closed"
                      ? "El complejo está cerrado para esta fecha. Elegí otro día en la agenda."
                      : bookableWindow === null
                        ? "No hay tarifas configuradas para esta cancha."
                        : "No quedan horarios disponibles para esta duración."}
                  </span>
                </div>
              ) : (
                <Select
                  id="booking-start"
                  value={selectedSlot?.startTime ?? ""}
                  onChange={(event) => setStartTime(event.target.value)}
                  aria-invalid={Boolean(errors.slot)}
                >
                  {availableSlots.map((slot) => (
                    <option key={slot.startTime} value={slot.startTime}>
                      {slot.startTime} – {slot.endTime}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">
              <User aria-hidden="true" className="size-3.5 text-ink-faint" />
              Cliente
            </h3>

            <Field
              label="Nombre"
              htmlFor="booking-name"
              required
              error={errors.name}
            >
              <Input
                id="booking-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre y apellido"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
              />
            </Field>

            <Field
              label="Teléfono"
              htmlFor="booking-phone"
              required
              error={errors.phone}
            >
              <Input
                id="booking-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Teléfono de contacto"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                leadingIcon={<Phone aria-hidden="true" className="size-4" />}
              />
            </Field>

            <Field label="Email" htmlFor="booking-email" hint="Opcional.">
              <Input
                id="booking-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="cliente@correo.com"
                autoComplete="email"
              />
            </Field>
          </section>

          <section className="space-y-3">
            <Field
              label="Notas"
              htmlFor="booking-notes"
              hint="Indicaciones operativas para el turno."
            >
              <Textarea
                id="booking-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ej. necesita pelotas, llega 10 minutos antes..."
              />
            </Field>
          </section>

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
                  {selectedSlot
                    ? `${selectedSlot.startTime} – ${selectedSlot.endTime}`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Duración</dt>
                <dd className="font-mono text-right text-ink">
                  {formatDuration(durationMinutes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-2">
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-mono text-right font-semibold text-ink">
                  {total === null ? "—" : formatCurrency(total)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">
                  Seña ({venue.depositPercentage}%)
                </dt>
                <dd className="font-mono text-right text-amber-bright">
                  {deposit === null ? "—" : formatCurrency(deposit)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Saldo</dt>
                <dd className="font-mono text-right text-ink-muted">
                  {total === null || deposit === null
                    ? "—"
                    : formatCurrency(total - deposit)}
                </dd>
              </div>
            </dl>

            <p className="mt-3 border-t border-line/70 pt-3 text-caption leading-relaxed text-ink-faint">
              La reserva se crea con la seña pendiente. El cobro se registra
              después desde la gestión del turno.
            </p>
          </section>

          {formError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-sm border border-coral/30 bg-coral/10 px-3 py-2.5 text-xs text-coral-bright"
            >
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          ) : null}
        </form>
      )}
    </Sheet>
  );
}
