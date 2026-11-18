"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import type { CourtFormat } from "@/types/domain";
import type { DashboardMetrics } from "@/lib/utils/schedule-ui";
import { addDays, formatDuration, getDateLabel } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SegmentedControl,
  type SegmentedOption,
} from "@/components/ui/segmented-control";

export type FormatFilter = "ALL" | CourtFormat;

type ScheduleHeaderProps = {
  date: string;
  today: string;
  formatFilter: FormatFilter;
  formatOptions: SegmentedOption<FormatFilter>[];
  onFormatChange: (value: FormatFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  metrics: DashboardMetrics;
  onNewBooking: () => void;
};

const LEGEND_ITEMS = [
  { label: "Confirmado", dotClass: "bg-emerald" },
  { label: "Seña pendiente", dotClass: "bg-amber" },
  { label: "Cancelado", dotClass: "bg-coral" },
  { label: "Disponible", dotClass: "bg-ink-faint" },
];

export function ScheduleHeader({
  date,
  today,
  formatFilter,
  formatOptions,
  onFormatChange,
  search,
  onSearchChange,
  metrics,
  onNewBooking,
}: ScheduleHeaderProps) {
  const previousDate = addDays(date, -1);
  const nextDate = addDays(date, 1);
  const isToday = date === today;
  const occupancy =
    metrics.occupancy.percentage === null
      ? "—"
      : `${metrics.occupancy.percentage}%`;

  return (
    <header className="shrink-0 border-b border-line bg-header">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/?date=${previousDate}`}
            aria-label="Día anterior"
            className="flex size-9 items-center justify-center rounded-sm border border-line bg-surface-1 text-ink-muted transition-colors hover:border-line-strong hover:text-ink motion-reduce:transition-none"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Link>

          <div className="min-w-36 px-1">
            <p className="flex items-center gap-1.5 text-caption font-medium uppercase tracking-widest text-ink-faint">
              <CalendarDays aria-hidden="true" className="size-3" />
              Turnos
            </p>
            <p className="truncate text-sm font-semibold tracking-tight text-ink">
              {getDateLabel(date, today)}
            </p>
          </div>

          <Link
            href={`/?date=${nextDate}`}
            aria-label="Día siguiente"
            className="flex size-9 items-center justify-center rounded-sm border border-line bg-surface-1 text-ink-muted transition-colors hover:border-line-strong hover:text-ink motion-reduce:transition-none"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>

          <Link
            href={`/?date=${today}`}
            aria-current={isToday ? "date" : undefined}
            className={cn(
              "ml-1 flex h-9 items-center rounded-sm border px-3 text-xs font-semibold transition-colors motion-reduce:transition-none",
              isToday
                ? "border-cyan/35 bg-cyan/10 text-cyan"
                : "border-line bg-surface-1 text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            Hoy
          </Link>
        </div>

        <div className="order-3 w-full md:order-none md:w-auto">
          <SegmentedControl
            options={formatOptions}
            value={formatFilter}
            onChange={onFormatChange}
            ariaLabel="Filtrar por formato de cancha"
            size="sm"
            className="max-w-full overflow-x-auto"
          />
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-4 border-r border-line pr-4 sm:flex">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-lime" aria-hidden="true" />
              <span className="font-mono text-xs font-semibold text-ink">
                {occupancy}
              </span>
              <span className="text-caption text-ink-faint">Ocupación</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-semibold text-lime">
                {formatCurrency(metrics.collected)}
              </span>
              <span className="text-caption text-ink-faint">Cobrado</span>
            </div>
          </div>

          <div className="relative w-full sm:w-56 lg:w-64">
            <Input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar reserva o cliente..."
              aria-label="Buscar reserva o cliente"
              leadingIcon={<Search aria-hidden="true" className="size-4" />}
              className="h-9"
            />
          </div>

          <Button size="md" onClick={onNewBooking} className="hidden sm:inline-flex">
            <Plus aria-hidden="true" className="size-4" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/70 px-4 py-2 lg:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGEND_ITEMS.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-caption text-ink-faint"
            >
              <span
                className={cn("size-1.5 rounded-full", item.dotClass)}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>

        <p className="ml-auto text-caption text-ink-faint">
          {metrics.activeBookings} reservas ·{" "}
          <span className="font-mono">
            {formatDuration(metrics.occupancy.bookedMinutes)}
          </span>{" "}
          ocupadas
        </p>
      </div>
    </header>
  );
}
