# SPEC-01: Capa de Persistencia, Types y Validaciones (Rama: `feat/db-models`)

## 1. Autorización Explícita (Regla 5 y 24 de AGENTS.md)
El usuario autoriza explícitamente:
- Crear la conexión a MongoDB y los modelos de Mongoose.
- Crear los tipos de dominio en TypeScript y esquemas de validación en Zod.
- **Restricción:** Antes de instalar dependencias (`mongoose`, `zod`) o modificar `package.json`, inspeccionar `package.json` y confirmar si ya están instaladas. Si faltan, pedir autorización explícita antes de ejecutar `pnpm add`.

## 2. Objetivo
Implementar la capa base de datos en MongoDB (Mongoose) + TypeScript + Zod para un sistema single-tenant de **reservas de canchas de fútbol** (core) y **gestión de torneos con generación de fixture por IA** (secundario), garantizando integridad referencial y prevención de solapamiento de horarios (double booking) a nivel de base de datos.

## 3. Estructura de Archivos a Crear
- `src/lib/db/connect.ts` — Conexión singleton cacheada a MongoDB usando `process.env.MONGODB_URI`.
- `src/types/domain.ts` — Interfaces, tipos y enums puros de TypeScript (sin dependencias de Mongoose).
- `src/lib/validations/venue.schema.ts` — Schemas Zod para `VenueConfig` y `Court`.
- `src/lib/validations/booking.schema.ts` — Schemas Zod para `Booking`.
- `src/lib/validations/tournament.schema.ts` — Schemas Zod para `Tournament`, `TournamentMatch` y el contrato de salida estructurada del generador de fixture con IA.
- `src/lib/db/models/VenueConfig.ts`
- `src/lib/db/models/Court.ts`
- `src/lib/db/models/Booking.ts`
- `src/lib/db/models/Tournament.ts`
- `src/lib/db/models/TournamentMatch.ts`
- `src/lib/db/models/index.ts` — Barrel export limpio de todos los modelos.

---

## 4. Especificación Detallada de Modelos

### 4.1 `VenueConfig` (Configuración global del predio - Documento único)
- `singletonKey`: `string` (`"MAIN_VENUE"`, `unique: true`, `default: "MAIN_VENUE"`)
- `name`: `string` (required, trim)
- `address`: `string` (optional)
- `phone`: `string` (optional)
- `slotDurationMinutes`: `number` (required, default: `60`, min: `30`)
- `depositPercentage`: `number` (required, default: `30`, min: `0`, max: `100`)
- `operatingHours`: Array de objetos (0=Domingo .. 6=Sábado):
  - `dayOfWeek`: `number` (0..6, required)
  - `isOpen`: `boolean` (required)
  - `openTime`: `string` (formato `"HH:mm"`, ej. `"09:00"`)
  - `closeTime`: `string` (formato `"HH:mm"`, ej. `"23:59"`)
- `timestamps: true`

### 4.2 `Court` (Canchas del predio)
- `name`: `string` (required, unique, trim — ej. `"Cancha 1"`)
- `format`: `"F5" | "F7" | "F8" | "F11"` (required)
- `surface`: `"SINTETICO" | "CESPED" | "CEMENTO"` (required)
- `isIndoor`: `boolean` (default: `false`)
- `status`: `"ACTIVE" | "MAINTENANCE"` (default: `"ACTIVE"`)
- `pricing`: Array de franjas tarifarias:
  - `label`: `string` (ej. `"Tarifa Diurna"`, `"Tarifa Nocturna"`)
  - `startTime`: `string` (`"HH:mm"`)
  - `endTime`: `string` (`"HH:mm"`)
  - `price`: `number` (min: `0`)
- `timestamps: true`

### 4.3 `Booking` (Fuente única de verdad de ocupación de grilla)
Unifica reservas particulares, turnos fijos, partidos de torneo y bloqueos de mantenimiento para impedir solapamientos.
- `courtId`: `Schema.Types.ObjectId` (ref: `"Court"`, required, index: `true`)
- `date`: `string` (formato estricto `"YYYY-MM-DD"`, required, index: `true`)
- `startTime`: `string` (formato estricto `"HH:mm"`, required)
- `endTime`: `string` (formato estricto `"HH:mm"`, required)
- `type`: `"CASUAL" | "RECURRING" | "TOURNAMENT" | "BLOCKED"` (required)
- `status`: `"PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED"` (default: `"PENDING_PAYMENT"`, index: `true`)
- `customer`: Objeto (requerido si `type` es `"CASUAL"` o `"RECURRING"`):
  - `name`: `string` (trim)
  - `phone`: `string` (trim)
  - `email`: `string` (optional, trim)
- `payment`: Objeto:
  - `totalAmount`: `number` (required, min: `0`)
  - `paidAmount`: `number` (default: `0`, min: `0`)
  - `method`: `"CASH" | "TRANSFER" | "MERCADOPAGO" | "NONE"` (default: `"NONE"`)
- `tournamentMatchId`: `Schema.Types.ObjectId` (ref: `"TournamentMatch"`, optional, default: `null`)
- `notes`: `string` (optional)
- `timestamps: true`
- **Índice Único Compuesto Crítico (Prevención atómica de Double Booking):**
  ```ts
  BookingSchema.index(
    { courtId: 1, date: 1, startTime: 1 },
    {
      unique: true,
      partialFilterExpression: { status: { $ne: "CANCELLED" } },
    }
  );