# Visual Source of Truth

Cuando el proyecto contenga una referencia visual, esta debe considerarse la principal fuente de verdad visual.

La referencia puede encontrarse normalmente en:

`src/assets/reference/`

El agente debe identificar la referencia visual utilizada por el proyecto antes de realizar cambios de diseño.

La referencia tiene prioridad sobre cualquier interpretación genérica del estilo.

El objetivo no es crear una interfaz simplemente "parecida", sino reproducir con alta fidelidad la lógica visual observada en la referencia:

* composición
* proporciones
* jerarquía
* tipografía
* escala
* spacing
* alineaciones
* contraste
* tratamiento de imágenes
* superficies
* bordes
* radios
* navegación
* comportamiento responsive

El `DESIGN.md` contiene el sistema visual específico del proyecto y debe utilizarse como guía de implementación.

Cuando exista una contradicción entre una descripción textual del sistema y lo que realmente muestra la referencia visual, debe prevalecer la referencia visual.

---

## Visual Fidelity Rules

No introducir elementos visuales que no estén justificados por la referencia, el `DESIGN.md`, los requisitos explícitos del usuario o una necesidad funcional/técnica.

Evitar por defecto:

* patrones genéricos de SaaS
* dashboards
* glassmorphism excesivo
* neumorphism
* wireframes decorativos
* grids decorativos
* nodos
* círculos decorativos
* gradientes llamativos
* neón excesivo
* efectos cyberpunk
* exceso de pills
* sombras exageradas
* efectos hover innecesarios
* animaciones decorativas
* elementos flotantes sin función
* contenido inventado
* métricas inventadas
* testimonios inventados
* clientes inventados

Los efectos visuales deben reforzar la composición existente y nunca competir con ella.

---

## Reference Analysis

Antes de modificar visualmente el proyecto, el agente debe inspeccionar la referencia y determinar:

1. estructura del layout
2. composición
3. jerarquía tipográfica
4. escala de títulos
5. espaciado
6. paleta
7. contraste
8. superficies
9. bordes
10. radios
11. imágenes
12. navegación
13. elementos interactivos
14. comportamiento responsive observable o técnicamente necesario

No asumir elementos que no puedan justificarse mediante la referencia, los requisitos del proyecto o una necesidad técnica.

---

## Design System Priority

El sistema visual debe interpretarse en este orden:

1. referencia visual
2. reglas de este documento
3. tokens y especificaciones visuales de `DESIGN.md`
4. requisitos explícitos del usuario
5. necesidades funcionales y de accesibilidad
6. convenciones generales de UI

Las convenciones genéricas de diseño nunca deben reemplazar una decisión visual explícita de la referencia.

---

## Implementation Workflow

Los cambios visuales importantes requieren el siguiente flujo:

### 1. Inspección

Realizar una inspección read-only del proyecto.

Revisar:

* componentes
* estilos
* assets
* estructura
* configuración
* `DESIGN.md`
* referencia visual

No modificar archivos durante esta etapa.

### 2. Auditoría

Comparar la implementación existente con la referencia.

Identificar diferencias concretas en:

* layout
* tipografía
* colores
* spacing
* escala
* proporciones
* imágenes
* componentes
* responsive

### 3. Propuesta

Presentar:

* problemas encontrados
* cambios propuestos
* archivos afectados
* componentes afectados
* elementos que se mantienen
* elementos que se eliminan
* elementos nuevos necesarios

No implementar todavía.

### 4. Aprobación

Esperar autorización explícita del usuario.

### 5. Implementación

Implementar únicamente los cambios aprobados.

No introducir cambios visuales adicionales fuera del alcance aprobado.

### 6. Validación

Validar:

* desktop
* tablet
* mobile
* overflow horizontal
* jerarquía visual
* tipografía
* spacing
* contraste
* accesibilidad básica
* fidelidad respecto a la referencia

Si se detectan diferencias importantes, reportarlas antes de realizar cambios adicionales.