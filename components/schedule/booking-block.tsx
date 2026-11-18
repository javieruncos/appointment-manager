import type { BookingView } from "@/types/view";
import {
  formatTimeRange,
  getBookingStatusLabel,
  normalizeRange,
} from "@/lib/utils/schedule-ui";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

type BookingBlockProps = {
  booking: BookingView;
  heightClass: string;
  isLive: boolean;
  isDimmed: boolean;
  onSelectBooking: (booking: BookingView) => void;
};

type BookingTone = "neutral" | "lime" | "emerald" | "amber" | "coral";

function getTypeLabel(booking: BookingView): string {
  const labels: Record<BookingView["type"], string> = {
    CASUAL: "Reserva",
    RECURRING: "Turno fijo",
    TOURNAMENT: "Torneo",
    BLOCKED: "Bloqueo",
  };

  return labels[booking.type];
}

function getPresentation(
  booking: BookingView,
  isLive: boolean,
): {
  tone: BookingTone;
  accentClass: string;
  surfaceClass: string;
  label: string;
} {
  if (booking.status === "CANCELLED") {
    return {
      tone: "coral",
      accentClass: "border-l-coral",
      surfaceClass: "bg-surface-2",
      label: getBookingStatusLabel(booking.status),
    };
  }

  if (booking.type === "BLOCKED") {
    return {
      tone: "neutral",
      accentClass: "border-l-ink-faint",
      surfaceClass: "bg-surface-2",
      label: "Bloqueado",
    };
  }

  if (isLive) {
    return {
      tone: "lime",
      accentClass: "border-l-lime",
      surfaceClass: "bg-lime/5 shadow-lime",
      label: "En cancha",
    };
  }

  if (booking.status === "PENDING_PAYMENT") {
    return {
      tone: "amber",
      accentClass: "border-l-amber",
      surfaceClass: "bg-surface-2",
      label: getBookingStatusLabel(booking.status),
    };
  }

  return {
    tone: "emerald",
    accentClass: "border-l-emerald",
    surfaceClass: "bg-surface-2",
    label: getBookingStatusLabel(booking.status),
  };
}

function getPaymentLine(booking: BookingView): string {
  if (booking.status === "CANCELLED") {
    return "Slot liberado";
  }

  if (booking.payment.totalAmount === 0) {
    return "Sin cargo";
  }

  if (booking.payment.paidAmount >= booking.payment.totalAmount) {
    return "Pagado 100%";
  }

  if (booking.payment.paidAmount > 0) {
    return `Pagado ${formatCurrency(booking.payment.paidAmount)}`;
  }

  return `Total ${formatCurrency(booking.payment.totalAmount)}`;
}

export function BookingBlock({
  booking,
  heightClass,
  isLive,
  isDimmed,
  onSelectBooking,
}: BookingBlockProps) {
  const presentation = getPresentation(booking, isLive);
  const title =
    booking.customer?.name ??
    (booking.type === "BLOCKED" ? "Turno bloqueado" : "Reserva sin cliente");
  const subtitle =
    booking.notes ??
    `${getTypeLabel(booking)} · ${booking.customer?.phone ?? "Sin teléfono"}`;
  const { start, end } = normalizeRange(booking.startTime, booking.endTime);

  return (
    <button
      type="button"
      onClick={() => onSelectBooking(booking)}
      aria-haspopup="dialog"
      aria-label={`Abrir detalle de ${title}, ${formatTimeRange(start, end)}`}
      title={booking.notes}
      className={cn(
        "flex w-full flex-col justify-between gap-1 overflow-hidden border-y border-r border-line border-l-4 px-3 py-1.5 text-left transition-colors hover:bg-surface-3 motion-reduce:transition-none",
        presentation.accentClass,
        presentation.surfaceClass,
        heightClass,
        isDimmed && "opacity-35",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-tight text-ink">
            {title}
          </p>
          <p className="truncate text-caption text-ink-muted">{subtitle}</p>
        </div>
        <Badge tone={presentation.tone} className="shrink-0">
          {isLive ? (
            <span
              className="size-1.5 rounded-full bg-lime animate-pulse motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : null}
          {presentation.label}
        </Badge>
      </div>

      <div className="flex min-w-0 items-end justify-between gap-2">
        <p className="truncate font-mono text-caption text-ink-muted">
          {formatTimeRange(start, end)}
        </p>
        <p className="shrink-0 font-mono text-caption font-medium text-ink">
          {getPaymentLine(booking)}
        </p>
      </div>
    </button>
  );
}
