"use client";

import { useState, type ReactNode } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  RotateCcw,
  Trash2,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  deleteBookingAction,
  updateBookingStatusAction,
  type BookingStatusAction,
} from "@/app/actions/booking.actions";
import type { BookingView } from "@/types/view";
import {
  formatDuration,
  formatTimeRange,
  getBookingStatusLabel,
  normalizeRange,
} from "@/lib/utils/schedule-ui";
import { formatDateLong } from "@/lib/utils/date";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

type BookingDetailSheetProps = {
  booking: BookingView;
  courtName?: string;
  onClose: () => void;
  onUpdated: () => void;
};

type StatusAction = {
  action: BookingStatusAction;
  label: string;
  icon: ReactNode;
};

const BOOKING_TYPE_LABELS: Record<BookingView["type"], string> = {
  CASUAL: "Reserva casual",
  RECURRING: "Turno fijo",
  TOURNAMENT: "Torneo",
  BLOCKED: "Bloqueo de cancha",
};

const PAYMENT_METHOD_LABELS: Record<
  BookingView["payment"]["method"],
  string
> = {
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
  MERCADOPAGO: "Mercado Pago",
  NONE: "Sin registrar",
};

function getStatusTone(
  status: BookingView["status"],
): "emerald" | "amber" | "cyan" | "coral" {
  if (status === "CONFIRMED") {
    return "emerald";
  }

  if (status === "PENDING_PAYMENT") {
    return "amber";
  }

  if (status === "CANCELLED") {
    return "coral";
  }

  return "cyan";
}

function getDisplayName(booking: BookingView): string {
  if (booking.customer?.name) {
    return booking.customer.name;
  }

  return booking.type === "BLOCKED" ? "Turno bloqueado" : "Turno sin cliente";
}

function getStatusActions(booking: BookingView): StatusAction[] {
  const actions: StatusAction[] = [];

  if (booking.status !== "CONFIRMED") {
    actions.push({
      action: "confirm",
      label: "Confirmar",
      icon: <CheckCircle2 aria-hidden="true" className="size-4" />,
    });
  }

  if (booking.status !== "PENDING_PAYMENT") {
    actions.push({
      action: "reopen",
      label:
        booking.status === "CANCELLED" ? "Reabrir turno" : "Seña pendiente",
      icon: <RotateCcw aria-hidden="true" className="size-4" />,
    });
  }

  if (booking.status !== "CANCELLED") {
    actions.push({
      action: "cancel",
      label: "Cancelar turno",
      icon: <XCircle aria-hidden="true" className="size-4" />,
    });
  }

  return actions;
}

export function BookingDetailSheet({
  booking,
  courtName,
  onClose,
  onUpdated,
}: BookingDetailSheetProps) {
  const [pendingAction, setPendingAction] =
    useState<BookingStatusAction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isSubmitting = pendingAction !== null || isDeleting;
  const { start, end } = normalizeRange(booking.startTime, booking.endTime);
  const duration = end - start;
  const paid = booking.payment.paidAmount;
  const total = booking.payment.totalAmount;
  const remaining = Math.max(0, total - paid);
  const isSettled = remaining === 0;
  const actions = getStatusActions(booking);
  const primaryAction: BookingStatusAction =
    booking.status === "CANCELLED" ? "reopen" : "confirm";

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  async function handleStatusChange(action: BookingStatusAction) {
    if (isSubmitting) {
      return;
    }

    setPendingAction(action);
    setActionError(null);

    try {
      const result = await updateBookingStatusAction(booking.id, action);

      if (!result.success) {
        setActionError(
          result.error ?? "No se pudo actualizar el estado del turno.",
        );
        return;
      }

      onUpdated();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado del turno.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (isSubmitting) {
      return;
    }

    const confirmed = confirm(
      "¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      const result = await deleteBookingAction(booking.id);

      if (!result.success) {
        setActionError(
          result.error ?? "No se pudo eliminar la reserva."
        );
        return;
      }

      onUpdated();
      onClose();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la reserva."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Sheet
      open
      onClose={handleClose}
      eyebrow={`${courtName ?? "Cancha sin identificar"} · ${formatDateLong(booking.date)}`}
      title={getDisplayName(booking)}
      description={`${formatTimeRange(start, end)} · ${formatDuration(duration)}`}
      footer={
        <div className="space-y-2" aria-busy={isSubmitting}>
          {actionError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-sm border border-coral/30 bg-coral/10 px-3 py-2.5 text-xs text-coral-bright"
            >
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{actionError}</span>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            {actions.map(({ action, label, icon }) => (
              <Button
                key={action}
                variant={
                  action === "cancel"
                    ? "danger"
                    : action === primaryAction
                      ? "primary"
                      : "outline"
                }
                className={action === "cancel" ? "sm:col-span-2" : undefined}
                onClick={() => handleStatusChange(action)}
                disabled={isSubmitting}
              >
                {pendingAction === action ? (
                  <Loader2
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  icon
                )}
                {label}
              </Button>
            ))}
          </div>

          <Button
            variant="danger"
            className="sm:col-span-2"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isDeleting ? (
              <Loader2
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
            Eliminar Definitivamente
          </Button>

          <p className="text-caption text-ink-faint">
            Los cambios se reflejan inmediatamente en la agenda.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="rounded-md border border-line bg-surface-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-caption font-medium uppercase tracking-widest text-ink-faint">
                Estado actual
              </p>
              <p className="mt-1 text-sm font-semibold tracking-tight text-ink">
                {getBookingStatusLabel(booking.status)}
              </p>
            </div>
            <Badge tone={getStatusTone(booking.status)}>
              {getBookingStatusLabel(booking.status)}
            </Badge>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line/70 pt-3 text-xs">
            <div>
              <dt className="text-caption uppercase tracking-widest text-ink-faint">
                Fecha
              </dt>
              <dd className="mt-1 text-ink">{formatDateLong(booking.date)}</dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-widest text-ink-faint">
                Horario
              </dt>
              <dd className="mt-1 font-mono text-ink">
                {formatTimeRange(start, end)}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-widest text-ink-faint">
                Duración
              </dt>
              <dd className="mt-1 font-mono text-ink">
                {formatDuration(duration)}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase tracking-widest text-ink-faint">
                Tipo
              </dt>
              <dd className="mt-1 text-ink">
                {BOOKING_TYPE_LABELS[booking.type]}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-ink-muted">
            <User aria-hidden="true" className="size-3.5 text-ink-faint" />
            Cliente
          </h3>

          {booking.customer ? (
            <div className="rounded-md border border-line bg-surface-1 p-4">
              <p className="text-sm font-semibold tracking-tight text-ink">
                {booking.customer.name}
              </p>

              <div className="mt-3 space-y-2">
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="flex w-fit items-center gap-2 text-xs text-ink-muted transition-colors hover:text-cyan motion-reduce:transition-none"
                >
                  <Phone aria-hidden="true" className="size-3.5 text-ink-faint" />
                  <span className="font-mono">{booking.customer.phone}</span>
                </a>

                {booking.customer.email ? (
                  <a
                    href={`mailto:${booking.customer.email}`}
                    className="flex w-fit items-center gap-2 text-xs text-ink-muted transition-colors hover:text-cyan motion-reduce:transition-none"
                  >
                    <Mail
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-ink-faint"
                    />
                    <span className="break-all">{booking.customer.email}</span>
                  </a>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-ink-faint">
                    <Mail aria-hidden="true" className="size-3.5" />
                    Sin email registrado.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-line bg-surface-1 px-4 py-3 text-xs text-ink-muted">
              Este turno no tiene datos de cliente asociados.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-ink-muted">
            <Wallet aria-hidden="true" className="size-3.5 text-ink-faint" />
            Cobro
          </h3>

          <div className="rounded-md border border-line bg-surface-1 p-4">
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Total</dt>
                <dd className="font-mono font-semibold text-ink">
                  {formatCurrency(total)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Seña / pagado</dt>
                <dd className="font-mono text-ink">
                  {formatCurrency(paid)}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">Método</dt>
                <dd className="text-ink">
                  {PAYMENT_METHOD_LABELS[booking.payment.method]}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-2.5">
                <dt className="text-ink-muted">Saldo restante</dt>
                <dd
                  className={cn(
                    "font-mono font-semibold",
                    isSettled ? "text-emerald-bright" : "text-amber-bright",
                  )}
                >
                  {formatCurrency(remaining)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-widest text-ink-muted">
            <MessageSquareText
              aria-hidden="true"
              className="size-3.5 text-ink-faint"
            />
            Notas operativas
          </h3>

          <div className="rounded-md border border-line bg-surface-1 p-4 text-sm leading-relaxed">
            {booking.notes ? (
              <p className="whitespace-pre-wrap text-ink-muted">
                {booking.notes}
              </p>
            ) : (
              <p className="text-ink-faint">Sin notas operativas.</p>
            )}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
