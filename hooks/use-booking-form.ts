import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@/lib/validations/booking.schema";
import { createBookingAction } from "@/app/actions/booking.actions";
import type { VenueView, CourtView } from "@/types/view"; // 1. Importa tus tipos

// 2. Define el tipo de las propiedades que recibe el hook
export type UseBookingFormProps = {
  venue: VenueView;
  courts: CourtView[];
  onCreated?: () => void;
  onRequestClose?: () => void;
};

export function useBookingForm({ venue, courts, onCreated, onRequestClose }: UseBookingFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      courtId: courts[0]?.id ?? "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "10:00",
      // durationMinutes eliminado de aquí ya que no forma parte del esquema raíz
      customer: {
        name: "",
        phone: "",
        email: "",
      },
      status: "PENDING_PAYMENT",
      payment: {
        totalAmount: 0,
        paidAmount: 0,
        method: "NONE",
      },
    },
  });

 // 1. Recibe directamente 'data' tipado como BookingInput
  const onSubmit = async (data: BookingInput) => {
    setFormError(null);

    const result = await createBookingAction(data);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    form.reset();
    onCreated?.();
    onRequestClose?.();
  };

  return {
    form,
    onSubmit,
    formError,
    isSubmitting: form.formState.isSubmitting,
  };
}