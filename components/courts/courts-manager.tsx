"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Goal, Pencil, Plus } from "lucide-react";
import type { CourtView } from "@/types/view";
import {
  formatTimeRange,
  getSurfaceLabel,
  normalizeRange,
} from "@/lib/utils/schedule-ui";
import { formatCurrency } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CourtFormSheet } from "@/components/courts/court-form-sheet";

type CourtsManagerProps = {
  courts: CourtView[];
};

type SheetState =
  | { mode: "create" }
  | { mode: "edit"; court: CourtView }
  | null;

function CourtCard({
  court,
  onEdit,
}: {
  court: CourtView;
  onEdit: (court: CourtView) => void;
}) {
  const isActive = court.status === "ACTIVE";

  return (
    <article className="flex flex-col rounded-md border border-line bg-surface-1">
      <div className="flex items-start justify-between gap-3 border-b border-line/70 p-4">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-semibold tracking-tight text-ink">
              {court.name}
            </h2>
            <Badge tone="neutral" className="shrink-0 font-mono">
              {court.format}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {getSurfaceLabel(court.surface)} ·{" "}
            {court.isIndoor ? "Techada" : "Descubierta"}
          </p>
        </div>

        <Badge tone={isActive ? "emerald" : "amber"} className="shrink-0">
          {isActive ? "Activa" : "Inactiva"}
        </Badge>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
            Tarifas
          </p>
          <span className="font-mono text-caption text-ink-faint">
            {court.pricing.length}{" "}
            {court.pricing.length === 1 ? "franja" : "franjas"}
          </span>
        </div>

        {court.pricing.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {court.pricing.map((pricing, index) => {
              const range = normalizeRange(
                pricing.startTime,
                pricing.endTime,
              );

              return (
                <li
                  key={`${pricing.startTime}-${pricing.endTime}-${index}`}
                  className="flex items-start justify-between gap-3 border-b border-line/50 pb-2.5 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink">
                      {pricing.label}
                    </p>
                    <p className="mt-0.5 font-mono text-caption text-ink-muted">
                      {formatTimeRange(range.start, range.end)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-xs font-medium text-ink">
                    {formatCurrency(pricing.price)}
                    <span className="text-ink-faint">/h</span>
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-ink-faint">
            Sin tarifas configuradas.
          </p>
        )}
      </div>

      <div className="border-t border-line/70 p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onEdit(court)}
        >
          <Pencil aria-hidden="true" className="size-4" />
          Editar detalles y tarifas
        </Button>
      </div>
    </article>
  );
}

export function CourtsManager({ courts }: CourtsManagerProps) {
  const router = useRouter();
  const [sheetState, setSheetState] = useState<SheetState>(null);

  const openCreate = useCallback(() => {
    setSheetState({ mode: "create" });
  }, []);

  const openEdit = useCallback((court: CourtView) => {
    setSheetState({ mode: "edit", court });
  }, []);

  const closeSheet = useCallback(() => {
    setSheetState(null);
  }, []);

  const handleSaved = useCallback(() => {
    setSheetState(null);
    router.refresh();
  }, [router]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
              Configuración
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              Canchas y Tarifas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Administrá las canchas, su estado operativo y las franjas
              horarias de precios.
            </p>
          </div>

          <Button onClick={openCreate}>
            <Plus aria-hidden="true" className="size-4" />
            Nueva cancha
          </Button>
        </div>

        {courts.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courts.map((court) => (
              <CourtCard key={court.id} court={court} onEdit={openEdit} />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-1/40 px-6 py-16 text-center">
            <div className="mb-4 flex size-11 items-center justify-center rounded-sm border border-line bg-surface-2 text-ink-muted">
              <Goal aria-hidden="true" className="size-5" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              Sin canchas configuradas
            </h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              Creá la primera cancha para definir su formato, superficie y
              tarifas por franja horaria.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus aria-hidden="true" className="size-4" />
              Crear cancha
            </Button>
          </div>
        )}
      </div>

      {sheetState ? (
        <CourtFormSheet
          key={
            sheetState.mode === "edit"
              ? `edit-${sheetState.court.id}`
              : "create"
          }
          court={sheetState.mode === "edit" ? sheetState.court : undefined}
          onClose={closeSheet}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  );
}
