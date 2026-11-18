import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@/lib/validations/booking.schema";
import { createBookingAction } from "@/app/actions/booking.actions";
import { timeToMinutes, minutesToTime } from "@/lib/utils/schedule-calc";
import type { VenueView, CourtView } from "@/types/view";

export type UseBookingFormProps = {
  venue: VenueView;
  courts: CourtView[];
  date: string;
  initialCourtId?: string;
  initialStartTime?: string;
  onCreated?: () => void;
  onRequestClose?: () => void;
};

export function useBookingForm({
  venue,
  courts,
  date,
  initialCourtId,
  initialStartTime,
  onCreated,
  onRequestClose,
}: UseBookingFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const start = initialStartTime ?? "09:00";
  const startMinutes = timeToMinutes(start);
  const endMinutes = startMinutes + 60;
  const end = minutesToTime(endMinutes);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      courtId: initialCourtId ?? courts[0]?.id ?? "",
      date,
      startTime: start,
      endTime: end,
      type: "CASUAL",
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
      setFormError(result.error ?? "Ocurrió un error inesperado.");
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