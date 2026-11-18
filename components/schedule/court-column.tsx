import type { CourtView, MatchView, BookingView } from "@/types/view";
import type { CourtSegment, MinuteRange } from "@/lib/utils/schedule-ui";
import {
  getHeightClass,
  isBookingLive,
  isMatchLive,
} from "@/lib/utils/schedule-ui";
import { cn } from "@/lib/utils/cn";
import { BookingBlock } from "@/components/schedule/booking-block";
import { MatchBlock } from "@/components/schedule/match-block";

type CourtColumnProps = {
  court: CourtView;
  segments: CourtSegment[];
  window: MinuteRange;
  date: string;
  today: string;
  nowMinutes: number | null;
  search: string;
  onSelectSlot: (courtId: string, startTime: string) => void;
  onSelectBooking: (booking: BookingView) => void;
};

function matchesSearch(
  search: string,
  court: CourtView,
  booking?: BookingView,
  match?: MatchView,
): boolean {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  const values = [
    court.name,
    booking?.customer?.name,
    booking?.customer?.phone,
    booking?.customer?.email,
    booking?.notes,
    match?.homeTeamName,
    match?.awayTeamName,
    match?.groupName,
  ];

  return values.some((value) => value?.toLowerCase().includes(query));
}

export function CourtColumn({
  court,
  segments,
  window,
  date,
  today,
  nowMinutes,
  search,
  onSelectSlot,
  onSelectBooking,
}: CourtColumnProps) {
  if (segments.length === 0) {
    return (
      <div className="min-w-72 flex-1 border-r border-line bg-canvas last:border-r-0">
        <div className={cn("h-full", getHeightClass(window.end - window.start))} />
      </div>
    );
  }

  return (
    <div className="min-w-72 flex-1 border-r border-line bg-canvas last:border-r-0">
      {segments.map((segment) => {
        if (segment.kind === "booking") {
          return (
            <BookingBlock
              key={`booking-${segment.booking.id}`}
              booking={segment.booking}
              heightClass={getHeightClass(segment.end - segment.start)}
              isLive={isBookingLive(segment.booking, date, today, nowMinutes)}
              isDimmed={
                search.trim().length > 0 &&
                !matchesSearch(search, court, segment.booking, undefined)
              }
              onSelectBooking={onSelectBooking}
            />
          );
        }

        if (segment.kind === "match") {
          return (
            <MatchBlock
              key={`match-${segment.match.id}`}
              match={segment.match}
              heightClass={getHeightClass(segment.end - segment.start)}
              isLive={isMatchLive(segment.match, today, nowMinutes)}
              isDimmed={!matchesSearch(search, court, undefined, segment.match)}
            />
          );
        }

        return (
          <div key={`free-${segment.start}-${segment.end}`}>
            {segment.cells.map((cell, index) => {
              const heightClass = getHeightClass(cell.end - cell.start);

              if (!cell.bookable) {
                return (
                  <div
                    key={`no-price-${cell.start}`}
                    className={cn(
                      "flex w-full items-center border-b border-line/60 px-3 text-caption text-ink-faint",
                      heightClass,
                    )}
                  >
                    {index === 0 ? "Sin tarifa" : null}
                  </div>
                );
              }

              return (
                <button
                  key={`free-${cell.start}`}
                  type="button"
                  onClick={() => onSelectSlot(court.id, cell.startTime)}
                  aria-label={`Reservar ${court.name} de ${cell.startTime} a ${cell.endTime}`}
                  className={cn(
                    "group flex w-full items-center justify-between gap-2 border-b border-dashed border-line/70 px-3 text-left text-caption text-ink-faint transition-colors hover:border-lime/30 hover:bg-lime/5 hover:text-ink-muted motion-reduce:transition-none",
                    heightClass,
                  )}
                >
                  <span className="truncate">
                    {index === 0 ? "Disponible" : "\u00a0"}
                  </span>
                  <span className="shrink-0 font-medium text-lime opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:transition-none">
                    + Reservar
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
