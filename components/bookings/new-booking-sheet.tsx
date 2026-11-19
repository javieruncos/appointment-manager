"use client";

import type { CourtView, VenueView } from "@/types/view";
import { formatDateLong } from "@/lib/utils/date";
import { Sheet } from "@/components/ui/sheet";
import { NewBookingForm } from "./new-booking-form";

type NewBookingSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  venue: VenueView;
  courts: CourtView[];
  date: string;
  initialCourtId?: string;
  initialStartTime?: string;
};

export function NewBookingSheet({
  open,
  onClose,
  onCreated,
  venue,
  courts,
  date,
  initialCourtId,
  initialStartTime,
}: NewBookingSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Turno casual"
      title="Nueva reserva"
      description={`${venue.name} · ${formatDateLong(date)}`}
    >
      {open ? (
        <NewBookingForm
          key={`${initialCourtId ?? ""}-${initialStartTime ?? ""}-${date}`}
          venue={venue}
          courts={courts}
          date={date}
          initialCourtId={initialCourtId}
          initialStartTime={initialStartTime}
          onCreated={onCreated}
          onRequestClose={onClose}
        />
      ) : null}
    </Sheet>
  );
}