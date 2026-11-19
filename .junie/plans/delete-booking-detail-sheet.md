---
sessionId: session-261118-220047-1qe5
---

# Análisis Actual

### Estado de la Implementación

Tras investigar el proyecto, se encontró que **la infraestructura backend ya está implementada**:

1. **`lib/services/booking.service.ts`** (líneas 170-182): ya exporta `deleteBooking(id)` con validación `isValidObjectId` y `BookingModel.findByIdAndDelete(id)`.
2. **`app/actions/booking.actions.ts`** (líneas 71-83): ya exporta `deleteBookingAction(id)` que invoca al servicio y ejecuta `revalidatePath("/")`.

### Problema Encontrado

El botón de "Eliminar Definitivamente" **ya existe en `NewBookingForm`** (`components/bookings/new-booking-form.tsx`, líneas 195-210) pero:
- Está mal ubicado: pertenece al modal de detalle, no al formulario de creación.
- Usa variables indefinidas (`booking`, `booking._id`) que no existen en ese contexto.
- Usa estilos inline (`text-red-500`) que violan el AGENTS.md.
- Importa `deleteBookingAction` innecesariamente.

### Lo que Falta

Agregar el botón de eliminación en **`BookingDetailSheet`** (`src/components/admin/BookingDetailSheet.tsx`), que es el componente correcto para acciones sobre una reserva existente.

# Cambios Propuestos

### Archivo a Modificar

**`src/components/admin/BookingDetailSheet.tsx`** — único archivo que se modifica.

### Cambios en BookingDetailSheet

1. **Importar `deleteBookingAction`** desde `@/app/actions/booking.actions`.
2. **Importar el ícono `Trash2`** desde `lucide-react`.
3. **Agregar estado `isDeleting`** (boolean) para controlar el loading durante la eliminación.
4. **Agregar función `handleDelete`** que:
   - Muestre `confirm("¿Estás seguro de eliminar esta reserva? Esta acción no se puede deshacer.")`.
   - Si el usuario confirma, llame a `deleteBookingAction(booking.id)`.
   - Si tiene éxito, cierre el sheet llamando a `onClose()` y `onUpdated()`.
   - Si falla, muestre el error en `actionError`.
5. **Agregar botón "Eliminar Definitivamente"** en el footer del Sheet:
   - Variant `danger` (ya disponible en `Button`).
   - Ícono `Trash2`.
   - Estado loading con `Loader2` animado.
   - Span completo (`sm:col-span-2`) para que ocupe ambas columnas.
   - Deshabilitado durante `isSubmitting` o `isDeleting`.

### Patrón de Confirmación

Se usará `window.confirm()` para mantener consistencia con el patrón ya existente en el proyecto (usado en `new-booking-form.tsx` línea 197). Esto evita agregar un componente adicional y mantiene la solución mínima.

# Delivery Steps

### ✓ Step 1: Agregar botón de eliminación en BookingDetailSheet
Se agrega el botón "Eliminar Definitivamente" con confirmación en el modal de detalle de reserva.

- Importar `deleteBookingAction` y `Trash2` en `BookingDetailSheet.tsx`.
- Agregar estado `isDeleting` y función `handleDelete` con `confirm()` antes de llamar a la acción.
- Insertar el botón con variant `danger`, ícono `Trash2`, y loading state en el footer del Sheet.
- El botón ocupará ambas columnas (`sm:col-span-2`) debajo de las acciones de estado.
- Al eliminar con éxito, cerrar el sheet y llamar a `onUpdated()`.