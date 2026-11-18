"use server";

import { createBooking, updateBookingStatus } from "@/lib/services/booking.service";
import { revalidatePath } from "next/cache";
import type { BookingInput } from "@/lib/validations/booking.schema";

const BOOKING_STATUS_BY_ACTION = {
  confirm: "CONFIRMED",
  cancel: "CANCELLED",
  reopen: "PENDING_PAYMENT",
} as const;

export type BookingStatusAction = keyof typeof BOOKING_STATUS_BY_ACTION;

function isBookingStatusAction(value: string): value is BookingStatusAction {
  return Object.prototype.hasOwnProperty.call(
    BOOKING_STATUS_BY_ACTION,
    value,
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Server Action para crear una nueva reserva.
 * Conecta el formulario del cliente directamente con el servicio de backend.
 */
export async function createBookingAction(input: BookingInput) {
  try {
    const booking = await createBooking(input);

    // Revalidamos las vistas afectadas para que la UI se actualice al instante
    revalidatePath("/");
    revalidatePath("/admin/bookings");
    revalidatePath("/courts");

    // Serializamos el documento de Mongoose para evitar errores con Client Components
    return {
      success: true,
      data: JSON.parse(JSON.stringify(booking)),
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(
        error,
        "Ocurrió un error al procesar la reserva",
      ),
    };
  }
}

/**
 * Server Action para confirmar, cancelar o reabrir una reserva.
 */
export async function updateBookingStatusAction(
  id: string,
  action: BookingStatusAction,
) {
  if (!isBookingStatusAction(action)) {
    return {
      success: false,
      error: "Acción de reserva inválida.",
    };
  }

  try {
    const updatedBooking = await updateBookingStatus(
      id,
      BOOKING_STATUS_BY_ACTION[action],
    );

    if (!updatedBooking) {
      return {
        success: false,
        error: "La reserva no existe o no se pudo actualizar.",
      };
    }

    revalidatePath("/");
    revalidatePath("/admin/bookings");
    revalidatePath("/courts");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedBooking)),
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(
        error,
        "No se pudo actualizar el estado de la reserva",
      ),
    };
  }
}
