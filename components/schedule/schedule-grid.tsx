"use client";

import { useMemo, type ReactNode } from "react";
import { CalendarX2, Search } from "lucide-react";
import type { BookingView, CourtView, MatchView, VenueView } from "@/types/view";
import {
  getCourtOccupancy,
  getCourtSegments,
  getFormatLabel,
  getHourCells,
  getMinPrice,
  getScheduleWindow,
  getSurfaceLabel,
  getVenueDayStatus,
} from "@/lib/utils/schedule-ui";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { CourtColumn } from "@/components/schedule/court-column";

type ScheduleGridProps = {
  date: string;
  today: string;
  venue: VenueView;
  courts: CourtView[];
  totalCourtCount: number;
  bookings: BookingView[];
  matches: MatchView[];
  nowMinutes: number | null;
  search: string;
  onSelectSlot: (courtId: string, startTime: string) => void;
  onSelectBooking: (booking: BookingView) => void;
};

function ScheduleEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-16">
      <div className="max-w-md rounded-lg border border-dashed border-line bg-surface-1/40 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink-muted">
          {icon}
        </div>
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
      </div>
    </div>
  );
}

function CourtHeader({
  court,
  venue,
  date,
  bookings,
  matches,
}: {
  court: CourtView;
  venue: VenueView;
  date: string;
  bookings: BookingView[];
  matches: MatchView[];
}) {
  const price = getMinPrice(court);
  const occupancy = getCourtOccupancy(court, venue, date, bookings, matches);
  const hasMultiplePrices = court.pricing.length > 1;

  return (
    <div className="min-w-72 flex-1 border-r border-line px-3 py-2 last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold tracking-tight text-ink">
              {court.name}
            </p>
            <Badge tone="neutral" className="shrink-0 font-mono">
              {court.format}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-caption text-ink-muted">
            {getSurfaceLabel(court.surface)} ·{" "}
            {court.isIndoor ? "Techada" : "Descubierta"} ·{" "}
            {getFormatLabel(court.format)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-xs font-semibold text-ink">
            {price === null ? "Sin tarifa" : `${hasMultiplePrices ? "Desde " : ""}${formatCurrency(price)}/h`}
          </p>
          <p className="mt-0.5 text-caption text-ink-muted">
            {occupancy.percentage === null
              ? "Sin horario"
              : `${occupancy.percentage}% ocupado`}
          </p>
        </div>
      </div>
    </div>
  );
}

function TimeRail({ cells }: { cells: ReturnType<typeof getHourCells> }) {
  return (
    <div className="sticky left-0 z-20 w-20 shrink-0 border-r border-line bg-canvas">
      {cells.map((cell) => (
        <div
          key={cell.start}
          className={cn(
            "flex items-start justify-end border-b border-line/60 pr-2 pt-1.5 font-mono text-caption text-ink-faint",
            cell.heightClass,
          )}
        >
          {cell.label}
        </div>
      ))}
    </div>
  );
}

export function ScheduleGrid({
  date,
  today,
  venue,
  courts,
  totalCourtCount,
  bookings,
  matches,
  nowMinutes,
  search,
  onSelectSlot,
  onSelectBooking,
}: ScheduleGridProps) {
  const dayStatus = getVenueDayStatus(venue, date);
  const hasPricing = courts.some((court) => court.pricing.length > 0);

  const scheduleWindow = useMemo(
    () => getScheduleWindow(courts, venue, date, bookings, matches),
    [courts, venue, date, bookings, matches],
  );

  const hourCells = useMemo(
    () => (scheduleWindow ? getHourCells(scheduleWindow) : []),
    [scheduleWindow],
  );

  const segmentsByCourt = useMemo(() => {
    if (!scheduleWindow) {
      return new Map<string, ReturnType<typeof getCourtSegments>>();
    }

    return new Map(
      courts.map((court) => [
        court.id,
        getCourtSegments(court, bookings, matches, scheduleWindow),
      ]),
    );
  }, [courts, bookings, matches, scheduleWindow]);

  const query = search.trim().toLowerCase();
  const courtNames = new Map(courts.map((court) => [court.id, court.name]));

  const searchResultCount = query
    ? bookings.filter((booking) => {
        const values = [
          booking.customer?.name,
          booking.customer?.phone,
          booking.customer?.email,
          booking.notes,
          courtNames.get(booking.courtId),
        ];

        return values.some((value) => value?.toLowerCase().includes(query));
      }).length +
      matches.filter((match) => {
        const values = [
          match.homeTeamName,
          match.awayTeamName,
          match.groupName,
          match.courtId ? courtNames.get(match.courtId) : undefined,
        ];

        return values.some((value) => value?.toLowerCase().includes(query));
      }).length
    : null;

  if (courts.length === 0) {
    return (
      <ScheduleEmpty
        icon={<CalendarX2 aria-hidden="true" className="size-5" />}
        title={
          totalCourtCount === 0
            ? "Sin canchas activas"
            : "Sin canchas para este formato"
        }
        description={
          totalCourtCount === 0
            ? "Creá una cancha activa para comenzar a recibir reservas."
            : "Probá con otro filtro de formato para ver la grilla."
        }
      />
    );
  }

  if (!scheduleWindow) {
    return (
      <ScheduleEmpty
        icon={<CalendarX2 aria-hidden="true" className="size-5" />}
        title={dayStatus === "closed" ? "Complejo cerrado" : "Sin horarios configurados"}
        description={
          dayStatus === "closed"
            ? "No hay atención configurada para esta fecha."
            : "Configurá horarios de atención y tarifas para ver la grilla operativa."
        }
      />
    );
  }

  if (!hasPricing && bookings.length === 0 && matches.length === 0) {
    return (
      <ScheduleEmpty
        icon={<CalendarX2 aria-hidden="true" className="size-5" />}
        title="Sin tarifas configuradas"
        description="Cargá al menos una franja tarifaria en una cancha para habilitar reservas."
      />
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {query && searchResultCount === 0 ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-header px-4 py-2 text-xs text-ink-muted lg:px-6">
          <Search aria-hidden="true" className="size-3.5 text-ink-faint" />
          No encontramos reservas o partidos para{" "}
          <span className="font-medium text-ink">“{search.trim()}”</span>.
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-full flex-col">
          <div className="sticky top-0 z-30 flex h-20 border-b border-line bg-header">
            <div className="sticky left-0 z-40 flex w-20 shrink-0 items-center justify-center border-r border-line bg-header text-caption font-medium uppercase tracking-widest text-ink-faint">
              Hora
            </div>

            {courts.map((court) => (
              <CourtHeader
                key={court.id}
                court={court}
                venue={venue}
                date={date}
                bookings={bookings}
                matches={matches}
              />
            ))}
          </div>

          <div className="flex min-w-full">
            <TimeRail cells={hourCells} />

            {courts.map((court) => (
              <CourtColumn
                key={court.id}
                court={court}
                segments={segmentsByCourt.get(court.id) ?? []}
                window={scheduleWindow}
                date={date}
                today={today}
                nowMinutes={nowMinutes}
                search={search}
                onSelectSlot={onSelectSlot}
                onSelectBooking={onSelectBooking}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
