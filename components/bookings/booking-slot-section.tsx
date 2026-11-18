// components/bookings/booking-slot-section.tsx
"use client";

import { CalendarDays, Clock } from "lucide-react";
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { CourtView, VenueView } from "@/types/view";
import { formatDateLong } from "@/lib/utils/date";
import { getFormatLabel } from "@/lib/utils/schedule-ui";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";

type BookingSlotSectionProps = {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  courts: CourtView[];
  venue: VenueView;
  date: string;
  availableSlots: Array<{ startTime: string; endTime: string; start: number; available: boolean }>;
  dayStatus: string;
  bookableWindow: unknown;
  durationOptions: SegmentedOption<string>[];
  slotError?: string;
};

export function BookingSlotSection({
  register,
  setValue,
  watch,
  courts,
  venue,
  date,
  availableSlots,
  dayStatus,
  bookableWindow,
  durationOptions,
  slotError,
}: BookingSlotSectionProps) {
  const watchedDuration = watch("durationMinutes");
  const watchedStartTime = watch("startTime");

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-1 px-3 py-2.5">
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          <CalendarDays aria-hidden="true" className="size-4 text-ink-faint" />
          {formatDateLong(date)}
        </span>
        <Badge tone="neutral">Fecha de la agenda</Badge>
      </div>

      <Field label="Cancha" htmlFor="booking-court" required>
        <Select id="booking-court" {...register("courtId")}>
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
            value={String(watchedDuration)}
            onChange={(value) => setValue("durationMinutes", Number(value))}
            ariaLabel="Duración de la reserva"
            size="sm"
          />
        </div>
      </Field>

      <Field label="Inicio" htmlFor="booking-start" required error={slotError}>
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
            value={watchedStartTime}
            {...register("startTime")}
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
  );
}