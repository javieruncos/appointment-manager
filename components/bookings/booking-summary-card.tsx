import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDuration } from "@/lib/utils/schedule-ui";

type BookingSummaryCardProps = {
  courtName?: string;
  slotLabel?: string;
  durationMinutes: number;
  total: number | null;
  deposit: number | null;
  depositPercentage: number;
};

export function BookingSummaryCard({
  courtName,
  slotLabel,
  durationMinutes,
  total,
  deposit,
  depositPercentage,
}: BookingSummaryCardProps) {
  return (
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
          <dd className="text-right font-medium text-ink">{courtName ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-muted">Horario</dt>
          <dd className="font-mono text-right text-ink">{slotLabel ?? "—"}</dd>
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
          <dt className="text-ink-muted">Seña ({depositPercentage}%)</dt>
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
        La reserva se crea con la seña pendiente. El cobro se registra después
        desde la gestión del turno.
      </p>
    </section>
  );
}