"use server";

import { revalidatePath } from "next/cache";
import { createBooking, updateBookingStatus } from "@/lib/services/booking.service";
import { bookingSchema } from "@/lib/validations/booking.schema";
import type { BookingStatus } from "@/types/domain";

export type BookingStatusAction = "confirm" | "cancel" | "reopen";

const ACTION_TO_STATUS: Record<BookingStatusAction, BookingStatus> = {
  confirm: "CONFIRMED",
  cancel: "CANCELLED",
  reopen: "PENDING_PAYMENT",
};

export async function createBookingAction(rawInput: unknown) {
  try {
    const parsed = bookingSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: "Datos de reserva inválidos." };
    }

    const newBooking = await createBooking(parsed.data);

    revalidatePath("/");
    revalidatePath("/admin/agenda");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(newBooking)),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ocurrió un error inesperado al crear la reserva.";
    return {
      success: false,
      error: message,
    };
  }
}

export async function updateBookingStatusAction(
  id: string,
  action: BookingStatusAction
) {
  try {
    const status = ACTION_TO_STATUS[action];
    const updated = await updateBookingStatus(id, status);

    if (!updated) {
      return { success: false, error: "No se encontró la reserva." };
    }

    revalidatePath("/");
    revalidatePath("/admin/agenda");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updated)),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar el estado de la reserva.";
    return {
      success: false,
      error: message,
    };
  }
}