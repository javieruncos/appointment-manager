"use client";

import { useBookingForm } from "@/hooks/use-booking-form";
import type { VenueView, CourtView } from "@/types/view";

export type NewBookingFormProps = {
  venue: VenueView;
  courts: CourtView[];
  date: string;
  initialCourtId?: string;
  initialStartTime?: string;
  onCreated?: () => void;
  onRequestClose?: () => void;
};

export function NewBookingForm(props: NewBookingFormProps) {
  const { form, onSubmit, formError, isSubmitting } = useBookingForm(props);
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
      {/* Mensaje de error general (ej. Cancha ocupada) */}
      {formError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
          {formError}
        </div>
      )}

      {/* 1. Cancha */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Cancha
        </label>
        <select
          {...register("courtId")}
          className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {props.courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>
        {errors.courtId && (
          <p className="text-xs text-red-500">{errors.courtId.message}</p>
        )}
      </div>

      {/* 2. Fecha */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Fecha
        </label>
        <input
          type="date"
          {...register("date")}
          className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors.date && (
          <p className="text-xs text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* 3. Horarios (Inicio y Fin) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Hora Inicio
          </label>
          <input
            type="time"
            {...register("startTime")}
            className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Hora Fin
          </label>
          <input
            type="time"
            {...register("endTime")}
            className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* 4. Datos del Cliente */}
      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold">Datos del Cliente</h4>
        
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nombre</label>
          <input
            type="text"
            {...register("customer.name")}
            placeholder="Ej. Juan Pérez"
            className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {errors.customer?.name && (
            <p className="text-xs text-red-500">{errors.customer.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
          <input
            type="text"
            {...register("customer.phone")}
            placeholder="Ej. 3811234567"
            className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <button
          type="button"
          onClick={props.onRequestClose}
          className="px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Crear Reserva"}
        </button>
      </div>
    </form>
  );
}