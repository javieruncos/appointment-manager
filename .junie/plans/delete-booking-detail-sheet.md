---
sessionId: session-261118-220047-1qe5
---

# Auditoría: Reservas aparecen como "Sin cargo"

## Diagnóstico

### Causa Raíz

El formulario de creación (`hooks/use-booking-form.ts`, líneas 49-53) envía `payment` con valores hardcoded:
```
{ totalAmount: 0, paidAmount: 0, method: "NONE" }
```

El servicio `createBooking` (`lib/services/booking.service.ts`, líneas 116-143) valida el input con `bookingSchema` y lo pasa directamente a `BookingModel.create(data)` **sin calcular los montos de pago**. Como resultado, toda reserva creada tiene `totalAmount: 0` y `paidAmount: 0`.

En la capa de presentación, `getPaymentLine` (`components/schedule/booking-block.tsx`, línea 90) devuelve "Sin cargo" cuando `totalAmount === 0`, lo cual es siempre cierto.

### Discrepancia entre capas

| Capa | Archivo | Comportamiento |
|------|---------|----------------|
| Modelo (Mongoose) | `lib/db/models/Booking.ts` | `payment.totalAmount` y `payment.paidAmount` son campos `Number` válidos |
| Servicio | `lib/services/booking.service.ts` | No calcula precios; guarda lo que recibe (0) |
| Cálculo disponible | `lib/utils/schedule-calc.ts` | `getRangeRate()`, `calculateBookingTotal()`, `calculateDeposit()` existen pero no se usan en `createBooking` |
| Presentación | `components/schedule/booking-block.tsx` | Lee `booking.payment.totalAmount` correctamente; el problema es que el valor en BD es 0 |

### Recursos existentes no utilizados

- `VenueConfig` (`types/domain.ts`, línea 39) tiene `depositPercentage` para calcular la seña.
- `Court.pricing` (`types/domain.ts`, líneas 43-48) tiene `price` por franja horaria.
- `schedule-calc.ts` expone:
  - `getRangeRate(court, startMinutes, duration)` → precio por hora según franja
  - `calculateBookingTotal(rate, durationMinutes)` → total = `(rate × duration) / 60`
  - `calculateDeposit(total, depositPercentage)` → seña = `(total × %) / 100`

## Propuesta de Corrección

### Archivo a Modificar

**`lib/services/booking.service.ts`** — único archivo que se modifica.

### Cambio en `createBooking`

Después de validar que la cancha existe y el horario está libre, y antes de `BookingModel.create(data)`, calcular los montos de pago desde el backend:

1. Consultar la `Court` (ya se consulta en la línea 127 para verificar que exista).
2. Calcular la duración en minutos usando `normalizeRange` desde `schedule-calc.ts`.
3. Obtener el precio por hora con `getRangeRate(courtView, startMinutes, duration)`.
4. Si hay precio:
   - Calcular `totalAmount` con `calculateBookingTotal(rate, duration)`.
   - Consultar el `VenueConfig` para obtener `depositPercentage`.
   - Calcular `paidAmount` con `calculateDeposit(totalAmount, depositPercentage)`.
   - Sobrescribir `data.payment.totalAmount` y `data.payment.paidAmount`.
5. Si no hay precio (cancha sin pricing o horario fuera de franja), mantener `totalAmount: 0`.

Esto sigue el principio **Backend-as-the-Authority**: el servidor calcula y decide los montos, ignorando los valores enviados desde el cliente.

### Arquitectura

```mermaid
graph LR
  A[Formulario (cliente)] -->|payment: 0| B[createBookingAction]
  B --> C[createBooking service]
  C --> D[CourtModel.findById]
  C --> E[VenueConfigModel.findOne]
  D --> F[getRangeRate + calculateBookingTotal]
  E --> G[calculateDeposit]
  F --> H[Override payment.totalAmount]
  G --> I[Override payment.paidAmount]
  H --> J[BookingModel.create]
  I --> J
```

# Delivery Steps

### ✓ Step 1: Calcular montos de pago en `createBooking` del servicio
El servicio `createBooking` calculará `totalAmount` y `paidAmount` usando el pricing de la cancha y el depósito del venue, sobrescribiendo los valores del cliente.

- Importar `getRangeRate`, `calculateBookingTotal`, `calculateDeposit`, `normalizeRange` desde `@/lib/utils/schedule-calc`.
- Importar `VenueConfigModel` desde `@/lib/db/models/VenueConfig`.
- Después de validar la cancha y el horario, construir un `CourtView` temporal a partir del documento Mongoose para pasar a `getRangeRate`.
- Calcular duración con `normalizeRange` y obtener `rate` con `getRangeRate`.
- Si hay rate, calcular `totalAmount` y consultar `VenueConfig` para obtener `depositPercentage` y calcular `paidAmount`.
- Sobrescribir `data.payment.totalAmount` y `data.payment.paidAmount` antes de `BookingModel.create(data)`.
- Validar con `pnpm build` que no haya errores de TypeScript.