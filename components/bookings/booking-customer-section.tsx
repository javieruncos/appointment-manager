// components/bookings/booking-customer-section.tsx
"use client";

import { User } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";

type BookingCustomerSectionProps = {
  register: UseFormRegister<any>;
  errors: FieldErrors;
};

export function BookingCustomerSection({
  register,
  errors,
}: BookingCustomerSectionProps) {
  return (
    <>
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-muted">
          <User aria-hidden="true" className="size-3.5 text-ink-faint" />
          Cliente
        </h3>

        <Field
          label="Nombre"
          htmlFor="booking-name"
          required
          error={errors.name?.message as string}
        >
          <Input
            id="booking-name"
            placeholder="Nombre y apellido"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            {...register("name", { required: "Ingresá el nombre del cliente." })}
          />
        </Field>

        <Field
          label="Teléfono"
          htmlFor="booking-phone"
          required
          error={errors.phone?.message as string}
        >
          <Input
            id="booking-phone"
            type="tel"
            inputMode="tel"
            placeholder="Teléfono de contacto"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone", {
              required: "Ingresá un teléfono de contacto.",
            })}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="booking-email"
          hint="Opcional."
          error={errors.email?.message as string}
        >
          <Input
            id="booking-email"
            type="email"
            placeholder="cliente@correo.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
      </section>

      <section className="space-y-3">
        <Field
          label="Notas"
          htmlFor="booking-notes"
          hint="Indicaciones operativas para el turno."
        >
          <Textarea
            id="booking-notes"
            placeholder="Ej. necesita pelotas, llega 10 minutos antes..."
            {...register("notes")}
          />
        </Field>
      </section>
    </>
  );
}