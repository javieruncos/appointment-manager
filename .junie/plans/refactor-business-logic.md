---
sessionId: session-261118-130553-osmi
---

# Auditoría: Flujo de actualización de estado de reservas

### Causa Raíz

**Desajuste entre los valores de acción de la UI y los valores de estado del dominio.**

La UI (`BookingDetailSheet.tsx`) envía nombres de acción en minúsculas (`"confirm"`, `"reopen"`, `"cancel"`), pero el esquema Zod y el servicio esperan valores de estado del dominio en mayúsculas (`"CONFIRMED"`, `"PENDING_PAYMENT"`, `"CANCELLED"`).

No existe ninguna capa de traducción entre ambos.

### Evidencia

#### 1. BookingDetailSheet.tsx (UI) — Líneas 90-119

La función `getStatusActions()` devuelve acciones con valores de acción:

| Acción | Valor enviado | Línea |
|---|---|---|
| Confirmar | `"confirm"` | 95 |
| Reabrir | `"reopen"` | 103 |
| Cancelar | `"cancel"` | 112 |

Estos valores se tipan como `BookingStatusAction` y se pasan a `updateBookingStatusAction(booking.id, action)` (línea 157).

#### 2. booking.actions.ts (Server Action) — Línea 8

```typescript
export type BookingStatusAction = Exclude<BookingStatus, "PENDING_PAYMENT">;
```

Esto significa que `BookingStatusAction` debería ser `"CONFIRMED" | "COMPLETED" | "CANCELLED"`.

Pero la UI usa `"confirm"`, `"reopen"`, `"cancel"` que **no coinciden** con ningún valor de `BookingStatusAction`. De hecho, TypeScript ya detecta este error:

```
Type '"confirm"' is not assignable to type 'BookingStatusAction'
Type '"reopen"' is not assignable to type 'BookingStatusAction'
Type '"cancel"' is not assignable to type 'BookingStatusAction'
```

#### 3. booking.service.ts (Servicio) — Líneas 135-136

```typescript
export async function updateBookingStatus(id: string, rawStatus: string) {
  const { status: newStatus } = updateBookingSchema.parse({ status: rawStatus });
```

El servicio pasa el valor directamente a `updateBookingSchema.parse()`, que valida contra:

#### 4. booking.schema.ts (Esquema) — Líneas 63-68

```typescript
status: z.enum([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]),
```

#### 5. types/domain.ts — Líneas 13-17

```typescript
export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";
```

### Análisis del Flujo Roto

```
UI (BookingDetailSheet)
  ↓ envía "confirm", "reopen", "cancel"
Server Action (updateBookingStatusAction)
  ↓ pasa el valor sin transformación
Servicio (updateBookingStatus)
  ↓ parsea con updateBookingSchema
Zod (booking.schema.ts)
  ↓ espera "CONFIRMED", "PENDING_PAYMENT", "CANCELLED"
  ❌ FALLA: "Invalid option: expected one of PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED"
```

### Mapeo Necesario

| Acción de UI | Estado del dominio | Razón |
|---|---|---|
| `"confirm"` | `"CONFIRMED"` | Confirmar la reserva |
| `"cancel"` | `"CANCELLED"` | Cancelar la reserva |
| `"reopen"` | `"PENDING_PAYMENT"` | Reabrir a estado pendiente de pago |

### Propuesta de Corrección

**Opción A (Recomendada): Crear un mapeo en la Server Action**

Agregar en `booking.actions.ts`:

```typescript
const ACTION_TO_STATUS: Record<string, BookingStatus> = {
  "confirm": "CONFIRMED",
  "cancel": "CANCELLED",
  "reopen": "PENDING_PAYMENT",
};
```

Actualizar `updateBookingStatusAction` para traducir antes de llamar al servicio.

Ventajas:
- Mantiene la semántica de acciones en la UI.
- Centraliza el mapeo en una sola capa.
- El servicio sigue recibiendo valores de estado válidos.

**Opción B: Usar valores de estado directamente en la UI**

Cambiar `getStatusActions()` para devolver `"CONFIRMED"`, `"CANCELLED"`, `"PENDING_PAYMENT"` directamente.

Ventajas:
- Sin capa de traducción adicional.
- Menos código.

Desventajas:
- La UI expone valores internos del dominio.
- Si el dominio cambia, hay que tocar la UI.

**Recomendación: Opción A.**

# Requisitos

### Objetivo

Refactorizar la lógica de negocio del sistema de horarios y reservas para que cada módulo tenga una responsabilidad clara, sin duplicación, sin cambiar comportamiento, y manteniendo la autoridad del backend sobre precios, depósitos, disponibilidad y estados.

### Alcance

**Incluido:**
- Centralizar constantes compartidas entre frontend y backend.
- Eliminar duplicación de `formatDuration`.
- Dividir `schedule-ui.ts` en módulos especializados.
- Extraer cálculos derivados de `use-booking-form` a un hook dedicado.
- Mantener compatibilidad mediante re-exports.

**Excluido:**
- Modificar servicios, modelos, validaciones, Server Actions o reglas de negocio del backend.
- Cambios visuales o de UX.
- Modificar componentes consumidores salvo que sea estrictamente necesario.
- Modificar `package.json` o lockfiles.
- Instalar dependencias.
- Crear tests (no existen tests en el proyecto actualmente).
- Commits de Git.

### Restricciones

- No cambiar el comportamiento de ninguna función.
- No modificar las reglas actuales de disponibilidad, tarifas y horarios.
- Evitar dependencias circulares.
- No crear abstracciones innecesarias.
- El frontend nunca será la fuente de verdad de importes, depósitos, estados ni disponibilidad definitiva.
- No enviar importes ni datos administrativos como valores autoritativos al backend.
- Mantener la compatibilidad de la interfaz pública de `use-booking-form`.

# Diseño Técnico

### Hallazgos de la inspección

**`schedule-ui.ts` (828 líneas)** mezcla:
- Lógica de negocio pura: cálculos de horarios, ventanas, disponibilidad, ocupación, métricas, precios.
- Lógica de presentación: clases CSS, labels de estado, formateo visual.
- Constantes: `ACTIVE_BOOKING_STATUSES`, `ACTIVE_MATCH_STATUSES`.
- Tipos: 12 tipos exportados.
- Segmentación del grid: construcción de segmentos y celdas.

**`use-booking-form.ts` (204 líneas)** importa 9 funciones de `schedule-ui.ts`:
- `calculateBookingTotal`, `calculateDeposit`, `formatDuration`, `getAvailabilitySlots`
- `getCourtBookableWindow`, `getDurationOptions`, `getRangeRate`, `getVenueDayStatus`
- `minutesToTime`, `timeToMinutes`

**Consumidores de `schedule-ui.ts`** (15 archivos):
- `components/bookings/booking-slot-section.tsx`: `getFormatLabel`
- `components/bookings/booking-summary-card.tsx`: `formatDuration`
- `components/courts/court-form-sheet.tsx`: `getSurfaceLabel`
- `components/courts/courts-manager.tsx`: `getSurfaceLabel`, `normalizeRange`
- `components/schedule/booking-block.tsx`: `getBookingStatusLabel`, `normalizeRange`
- `components/schedule/court-column.tsx`: `CourtSegment`, `MinuteRange`, `getHeightClass`, `isBookingLive`, `isMatchLive`
- `components/schedule/match-block.tsx`: `getMatchStatusLabel`, `normalizeRange`
- `components/schedule/schedule-board.tsx`: `getDashboardMetrics`, `getFormatLabel`
- `components/schedule/schedule-grid.tsx`: `getSurfaceLabel`, `getVenueDayStatus`
- `components/schedule/schedule-header.tsx`: `DashboardMetrics`
- `components/tournaments/match-score-sheet.tsx`: `getMatchStatusLabel`
- `components/tournaments/tournaments-manager.tsx`: `getMatchStatusLabel`
- `hooks/use-booking-form.ts`: 9 funciones de cálculo
- `lib/utils/tournament-ui.ts`: `formatTimeRange`, `normalizeRange`
- `src/components/admin/BookingDetailSheet.tsx`: `getBookingStatusLabel`, `normalizeRange`

**`booking.service.ts`** tiene sus propias copias de `ACTIVE_BOOKING_STATUSES` y `ACTIVE_MATCH_STATUSES` (líneas 20-29). **No se modificará** por la restricción de no tocar el backend.

**`formatDuration` duplicación**: Las implementaciones en `date.ts` (líneas 102-119) y `schedule-ui.ts` (líneas 150-164) **no son idénticas**:
- `date.ts`: maneja `minutes <= 0` → `"0 min"`.
- `schedule-ui.ts`: usa `Math.max(0, Math.round(minutes))` — no devuelve `"0 min"` explícitamente pero produce el mismo resultado para valores positivos.
- La versión de `date.ts` es más robusta para valores negativos.

**No existen tests**: No hay archivos `.test.ts`, `.spec.ts` ni scripts de test en `package.json`. Solo existen `pnpm lint` y `pnpm build`.

**No existe script `typecheck`**: Solo `pnpm lint` y `pnpm build`.

### Decisiones Clave

#### 1. Constantes: solo centralizar en frontend

`ACTIVE_BOOKING_STATUSES` y `ACTIVE_MATCH_STATUSES` se definen en `schedule-ui.ts` (frontend) y `booking.service.ts` (backend). Dado que **no se modificará el backend**, se creará `lib/constants/statuses.ts` solo para el lado frontend. El backend mantendrá sus propias constantes.

**Razón**: Respetar la restricción de no tocar servicios, validaciones ni reglas de negocio del backend.

#### 2. `formatDuration`: fuente única en `date.ts`

La versión de `date.ts` es más robusta (maneja valores negativos). Se eliminará la de `schedule-ui.ts` y se re-exportará desde `date.ts`.

**Razón**: `date.ts` es el módulo natural para funciones de formateo temporal y tiene una implementación más completa.

#### 3. División de `schedule-ui.ts` en 4 módulos

Cada módulo tendrá una responsabilidad única:

| Módulo | Responsabilidad | Importa de |
|---|---|---|
| `schedule-types.ts` | Tipos solo (interfaces, uniones) | Ninguno |
| `schedule-calc.ts` | Cálculos puros de negocio | `schedule-types.ts`, `date.ts` |
| `schedule-display.ts` | Labels, clases CSS, formateo visual | `schedule-types.ts`, `date.ts` |
| `schedule-segments.ts` | Segmentación del grid | `schedule-types.ts`, `schedule-calc.ts`, `date.ts` |
| `schedule-ui.ts` | Re-exports para compatibilidad | Los 4 módulos anteriores |

**Razón**: Separar lógica de negocio de lógica de presentación sin romper imports existentes.

#### 4. Hook `use-booking-calculations`: solo cálculos derivados para la UI

El hook no duplicará lógica de negocio — solo compondrá las funciones puras de `schedule-calc.ts` con el estado del formulario para producir valores derivados necesarios en la UI.

**Responsabilidades claras:**

| Módulo | Responsabilidad |
|---|---|
| `use-booking-form.ts` | react-hook-form, estado del formulario, validación, envío, gestión de errores |
| `use-booking-calculations.ts` | Cálculos derivados para mostrar disponibilidad, estimaciones de precios y resumen |
| `schedule-calc.ts` | Funciones puras reutilizables (fuente de verdad de los algoritmos) |

**Razón**: Separar responsabilidades sin trasladar complejidad. El hook de formulario se mantiene como el punto de entrada único para el componente consumidor.

#### 5. Cálculos del frontend vs backend

**Frontend (estimaciones para UI):**
- `getAvailabilitySlots`: mostrar slots disponibles al usuario.
- `getRangeRate`: mostrar tarifa estimada.
- `calculateBookingTotal`: mostrar total estimado.
- `calculateDeposit`: mostrar depósito estimado.
- `getDurationOptions`: opciones de duración.
- `getCourtBookableWindow`: ventana reservable.
- `getVenueDayStatus`: estado del predio.

**Backend (autoridad definitiva):**
- Validación de choques de horario (`hasOverlappingSchedule` en `booking.service.ts`).
- Cálculo definitivo de precios y depósitos.
- Determinación de estado de la reserva.
- Validación de disponibilidad real.
- El payload del formulario envía `totalAmount` y `paidAmount` pero el backend los revalida mediante `bookingSchema`.

**Razón**: El backend conserva la autoridad sobre todas las decisiones de negocio. El frontend solo muestra estimaciones.

### Archivos a Crear

| Archivo | Líneas estimadas | Responsabilidad |
|---|---|---|
| `lib/constants/statuses.ts` | ~10 | Constantes de estados compartidas (frontend) |
| `lib/utils/schedule-types.ts` | ~90 | Tipos del sistema de horarios |
| `lib/utils/schedule-calc.ts` | ~420 | Cálculos puros de negocio |
| `lib/utils/schedule-display.ts` | ~80 | Labels, clases CSS, formateo visual |
| `lib/utils/schedule-segments.ts` | ~180 | Segmentación del grid |
| `hooks/use-booking-calculations.ts` | ~60 | Cálculos derivados para la UI |

### Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `lib/utils/schedule-ui.ts` | Reemplazar contenido por re-exports desde los nuevos módulos |
| `lib/utils/date.ts` | Sin cambios (fuente de `formatDuration`) |
| `hooks/use-booking-form.ts` | Delegar cálculos a `useBookingCalculations`, mantener misma interfaz |
| `lib/services/booking.service.ts` | **Sin cambios** (restricción de no tocar backend) |

### Funciones por Módulo

#### `schedule-types.ts` (tipos solo)
- `MinuteRange`
- `VenueDayStatus`
- `FreeCell`
- `FreeSegment`
- `BookingSegment`
- `MatchSegment`
- `CourtSegment`
- `AvailabilitySlot`
- `Occupancy`
- `CourtOccupancy`
- `DashboardMetrics`
- `HourCell`

#### `schedule-calc.ts` (cálculos puros)
- `timeToMinutes` — convertir hora a minutos
- `minutesToTime` — convertir minutos a hora
- `normalizeRange` — normalizar rango horario
- `getVenueDayStatus` — estado del predio para un día
- `getVenueWindow` — ventana operativa del predio
- `getPricingWindow` (internal → export) — ventana de precios de una cancha
- `intersectWindows` — intersección de ventanas
- `getCourtBookableWindow` — ventana reservable de una cancha
- `getPricingSegment` (internal → export) — segmento tarifario
- `getHourlyRate` — tarifa horaria
- `getRangeRate` — tarifa para un rango (null si cruza franjas)
- `getMinPrice` — precio mínimo de una cancha
- `getDurationOptions` — opciones de duración
- `getAvailabilitySlots` — slots de disponibilidad
- `getCourtOccupancy` — ocupación de una cancha
- `getDashboardMetrics` — métricas del dashboard
- `calculateBookingTotal` — total estimado de reserva
- `calculateDeposit` — depósito estimado

#### `schedule-display.ts` (presentación)
- `formatTimeRange` — formatear rango horario
- `formatDuration` — re-export desde `date.ts`
- `getHeightClass` — clase CSS de altura
- `getBookingStatusLabel` — label de estado de reserva
- `getMatchStatusLabel` — label de estado de partido
- `getFormatLabel` — label de formato de cancha
- `getSurfaceLabel` — label de superficie

#### `schedule-segments.ts` (segmentación del grid)
- `getScheduleWindow` — ventana del schedule
- `getHourCells` — celdas horarias
- `getCourtSegments` — segmentos de una cancha
- `isBookingLive` — si una reserva está en vivo
- `isMatchLive` — si un partido está en vivo

#### `use-booking-calculations.ts` (hook de cálculos)
- `availableSlots` — slots disponibles filtrados
- `selectedSlot` — slot seleccionado
- `durationOptions` — opciones de duración con labels
- `bookableWindow` — ventana reservable
- `dayStatus` — estado del predio
- `rate` — tarifa estimada
- `total` — total estimado
- `deposit` — depósito estimado

#### `use-booking-form.ts` (hook de formulario — después de refactor)
- `register`, `setValue`, `watch`, `errors` — react-hook-form
- `formError`, `isSubmitting` — estado de errores y envío
- `selectedCourt` — cancha seleccionada
- `canSubmit` — si se puede enviar
- `onSubmit` — manejador de envío
- Internamente usa `useBookingCalculations` para obtener: `availableSlots`, `selectedSlot`, `durationOptions`, `bookableWindow`, `dayStatus`, `total`, `deposit`

### Dependencias entre Módulos

```
schedule-types.ts (no importa nada del sistema de schedule)
    ↑
    ├── schedule-calc.ts (importa: schedule-types, date.ts, types/view)
    │       ↑
    │       └── schedule-segments.ts (importa: schedule-types, schedule-calc, date.ts, types/view)
    │
    └── schedule-display.ts (importa: schedule-types, date.ts, types/domain)
            ↑
            └── schedule-ui.ts (re-exporta todo de los 4 módulos)
                    ↑
                    ├── use-booking-calculations.ts (importa: schedule-calc)
                    │       ↑
                    │       └── use-booking-form.ts (importa: use-booking-calculations, schedule-calc para minutesToTime/timeToMinutes)
                    │
                    └── componentes UI (importan lo que necesiten)
```

**No hay dependencias circulares**: los tipos no importan nada; los cálculos importan solo tipos y `date.ts`; los segmentos importan cálculos; el display importa solo tipos; `schedule-ui.ts` re-exporta sin agregar lógica.

### Regla de `getRangeRate` — tarifas por franjas horarias

La implementación actual de `getRangeRate` (líneas 296-308) devuelve `null` si una reserva cruza dos franjas tarifarias:

```typescript
if (!segment || start + duration > segment.end) {
  return null;
}
```

Esto significa que si una reserva de 90 minutos comienza a las 18:00 y hay una franja de 18:00-20:00 y otra de 20:00-22:00, la función devuelve `null` porque `18:00 + 90min = 19:30` está dentro de la primera franja (OK), pero si la franja termina a las 19:00, `18:00 + 90min = 19:30 > 19:00` → `null`.

**No se cambiará este comportamiento**. Se mantendrá tal cual.

### Contrato de Entrada del Formulario

El payload que envía `use-booking-form.ts` al backend incluye:
- `status: "PENDING_PAYMENT"` — hardcodeado, no controlado por el usuario.
- `payment.totalAmount` — calculado en frontend como estimación.
- `payment.paidAmount: 0` — hardcodeado.
- `payment.method: "NONE"` — hardcodeado.

El backend revalida todo mediante `bookingSchema.parse()` en `createBooking()`. El schema acepta estos campos pero el backend es quien los autoriza.

**No se modificará este comportamiento**. La refactorización solo separa responsabilidades en el frontend.

# Validación

### Comandos a ejecutar

Dado que no existen tests ni script `typecheck` en el proyecto, la validación se limita a:

1. `pnpm lint` — verificar que no haya problemas de ESLint.
2. `pnpm build` — verificar que el build completo de Next.js compile sin errores.
3. Revisión manual de imports circulares — verificar que ningún módulo importe de forma circular.

### Nota sobre tests

No existen tests unitarios en el proyecto actualmente (no hay archivos `.test.ts`, `.spec.ts` ni scripts de test en `package.json`). El usuario solicitó incluir tests, pero dado que:
- No hay framework de testing instalado.
- El AGENTS.md prohíbe instalar dependencias sin autorización.
- No hay tests existentes que ejecutar.

**No se crearán tests** como parte de esta refactorización. Se puede planificar una ronda futura de tests si el usuario lo autoriza.

# Riesgos

### Riesgo 1: Re-exports incompletos
**Descripción**: Al dividir `schedule-ui.ts`, alguna función o tipo podría no re-exportarse correctamente, rompiendo imports existentes.
**Mitigación**: Verificar cada uno de los 15 consumidores y asegurar que todas las funciones que importan estén presentes en los re-exports.

### Riesgo 2: Comportamiento de `formatDuration`
**Descripción**: Las dos implementaciones difieren en el manejo de valores negativos. Cambiar la fuente podría afectar edge cases.
**Mitigación**: La versión de `date.ts` es más robusta (`minutes <= 0` → `"0 min"`). Los consumidores actuales (`booking-summary-card.tsx`, `schedule-header.tsx`) solo pasan valores positivos. No se espera impacto.

### Riesgo 3: Hook `use-booking-calculations` introduce overhead
**Descripción**: Agregar un hook intermedio podría duplicar cálculos innecesarios si no se estructura correctamente.
**Mitigación**: El hook usará `useMemo` para los mismos valores que ya calcula `use-booking-form`, sin agregar cálculos adicionales. Las funciones puras de `schedule-calc.ts` son la fuente única.

### Riesgo 4: `getPricingWindow` y `intersectWindows` son internas
**Descripción**: Estas funciones no están exportadas actualmente pero son usadas por `getCourtBookableWindow`. Al mover código, necesitan exportarse.
**Mitigación**: Exportar desde `schedule-calc.ts` pero no incluirlas en los re-exports de `schedule-ui.ts` para mantener la misma superficie pública.

### Riesgo 5: Backend mantiene constantes duplicadas
**Descripción**: `booking.service.ts` conservará sus propias copias de `ACTIVE_BOOKING_STATUSES` y `ACTIVE_MATCH_STATUSES`. La duplicación persiste entre capas.
**Mitigación**: Aceptado como restricción explícita del usuario. El backend no se modifica. La centralización es solo a nivel frontend.

# Entrega

### Archivos creados (6) ✓
1. `lib/constants/statuses.ts` — Constantes de estados (frontend)
2. `lib/utils/schedule-types.ts` — Tipos del sistema de horarios
3. `lib/utils/schedule-calc.ts` — Cálculos puros de negocio
4. `lib/utils/schedule-display.ts` — Labels, clases CSS, formateo visual
5. `lib/utils/schedule-segments.ts` — Segmentación del grid
6. `hooks/use-booking-calculations.ts` — Cálculos derivados para la UI

### Archivos modificados (2) ✓
1. `lib/utils/schedule-ui.ts` — Reemplazado por re-exports desde los nuevos módulos
2. `hooks/use-booking-form.ts` — Delega cálculos a `useBookingCalculations`

### Archivos sin cambios (confirmados)
- `lib/services/booking.service.ts` — Backend intacto
- `lib/validations/booking.schema.ts` — Validaciones intactas
- `app/actions/booking.actions.ts` — Server actions intactas
- `lib/utils/date.ts` — Sin cambios (fuente de `formatDuration`)
- `lib/utils/schedule.ts` — Sin cambios
- `lib/utils/tournament-ui.ts` — Sin cambios
- `lib/utils/view-models.ts` — Sin cambios
- `lib/utils/currency.ts` — Sin cambios
- `lib/utils/cn.ts` — Sin cambios
- Todos los componentes — Sin cambios (gracias a re-exports)

### Validación
- `pnpm lint`
- `pnpm build`
- Revisión de imports circulares