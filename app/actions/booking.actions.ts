"use server";

import { createBooking, updateBookingStatus } from "@/lib/services/booking.service";
import { revalidatePath } from "next/cache";
import type { BookingInput } from "@/lib/validations/booking.schema";

/**
 * Server Action para crear una nueva reserva.
 * Conecta el formulario del cliente directamente con el servicio de backend.
 */
export async function createBookingAction(input: BookingInput) {
  try {
    const booking = await createBooking(input);

    // Revalidamos las vistas afectadas para que la UI se actualice al instante
    revalidatePath("/admin/bookings");
    revalidatePath("/courts");

    // Serializamos el documento de Mongoose para evitar errores con Client Components
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(booking)) 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "Ocurrió un error al procesar la reserva" 
    };
  }
}

/**
 * Server Action para actualizar el estado de una reserva (ej. Confirmar, Cancelar).
 */
export async function updateBookingStatusAction(id: string, newStatus: string) {
  try {
    const updatedBooking = await updateBookingStatus(id, newStatus);

    revalidatePath("/admin/bookings");

    return { 
      success: true, 
      data: updatedBooking ? JSON.parse(JSON.stringify(updatedBooking)) : null 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || "No se pudo actualizar el estado de la reserva" 
    };
  }
}