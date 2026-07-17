# AGENTS.md — Frontend

## Propósito

Frontend web de AccionaFleet. Este archivo es el contrato técnico para MetaContext, MetaCoder y MetaReviewer y complementa las instrucciones del workspace raíz.

## Stack tecnológico

- Next.js 16.2.9 con App Router.
- React 19.2.0 y TypeScript.
- Node.js/npm; `package-lock.json` es la fuente de reproducibilidad de dependencias.
- ESLint 9 con `eslint-config-next`.
- `openapi-typescript` para generar tipos y `openapi-fetch` para consumir el backend.
- Contrato fuente: `../../.metacontext/deliverables/contracts/OpenApi.yaml`.
- Variable pública de ejecución: `NEXT_PUBLIC_API_BASE_URL`.

## Arquitectura y estructura

- `app/`: rutas, páginas, layout raíz y estilos globales del App Router.
- `src/lib/`: clientes, adaptadores y utilidades compartidas.
- `src/generated/`: código generado desde OpenAPI; no editar manualmente.
- `public/` (si se incorpora): activos estáticos sin lógica de negocio.

Mantener la lógica de acceso a API en `src/lib` y no dispersar llamadas `fetch` por las páginas. Las páginas orquestan la UI; los adaptadores traducen entre el contrato OpenAPI y las necesidades de presentación. Preferir Server Components por defecto y marcar `"use client"` solo cuando se necesite estado, eventos o APIs del navegador.

## Reglas de implementación

1. Antes de codificar, inspeccionar el grafo con `search_graph`, `trace_path` y `get_code_snippet`, además de revisar el contrato OpenAPI y los patrones cercanos.
2. Usar TypeScript estricto; evitar `any`, casts innecesarios y tipos duplicados que ya existan en `src/generated`.
3. Para cambios de API, modificar primero el contrato OpenAPI, ejecutar `npm run generate` y después adaptar el cliente y la UI. Nunca modificar archivos generados a mano.
4. Centralizar base URL, headers, serialización, errores y autenticación en el cliente de `src/lib`. No incluir secretos en variables `NEXT_PUBLIC_*`.
5. Gestionar explícitamente estados de carga, éxito, error, vacío y reintento. Los mensajes mostrados al usuario no deben filtrar stack traces, tokens ni información interna.
6. Mantener accesibilidad: HTML semántico, labels asociados, navegación por teclado, foco visible, contraste suficiente y feedback compatible con lectores de pantalla.
7. Mantener componentes pequeños y cohesivos. Extraer componentes reutilizables cuando exista comportamiento o presentación repetida; evitar abstracciones prematuras.
8. Respetar límites Server/Client y evitar acceder a `window`, `document` o secretos desde Server Components. Validar datos recibidos de URL, formularios y API.
9. No introducir librerías de UI, estado o red sin justificar su necesidad y compatibilidad con Next.js 16/React 19. Preferir las dependencias ya aprobadas.
10. Mantener cambios de estilos localizados, nombres claros y diseño responsive. No ocultar errores mediante `eslint-disable` o casts globales.

## Flujo de ramas

- Antes de crear una rama de feature, actualizar las referencias remotas y crearla desde el estado más reciente de la rama remota `origin/main`. No utilizar un `main` local que pueda estar desactualizado.
- Como comprobación mínima, ejecutar `git fetch origin main` y crear la rama a partir de `origin/main`.

## Pruebas y calidad

- Ejecutar `npm run typecheck` en cada cambio TypeScript.
- Ejecutar `npm run lint` en cada cambio de código o configuración.
- Ejecutar `npm run build` cuando cambien rutas, configuración Next, variables de entorno, generación OpenAPI o integración con backend.
- Probar manualmente estados de carga/error/vacío para cada flujo de datos nuevo y añadir pruebas automatizadas cuando se incorpore el runner aprobado por el proyecto.
- Revisar que `npm run generate` produzca un resultado limpio y determinista; el código generado debe quedar sincronizado con el contrato.

## Seguridad para MetaReviewer

Revisar XSS y renderizado de contenido no confiable, exposición de secretos, uso correcto de `NEXT_PUBLIC_*`, CSRF según el mecanismo de sesión, validación de formularios, URLs externas, dependencias npm, fugas de datos en errores y límites entre Server/Client Components. Clasificar hallazgos como `CRITICAL`, `HIGH`, `MEDIUM` o `LOW`, con archivo/línea, impacto, evidencia y corrección propuesta.

## Flujo MetaContext / MetaCoder / MetaReviewer

MetaCoder debe: (1) leer este contrato y el plan, (2) consultar el grafo, (3) verificar el contrato OpenAPI, (4) generar tipos antes de integrar cambios, (5) implementar respetando Server/Client Components, y (6) ejecutar typecheck, lint y build según el alcance.

MetaReviewer debe verificar contrato frontend-backend, tipos generados, estados de UI, accesibilidad, seguridad, rendimiento de Server/Client Components, manejo de errores y calidad de configuración. Debe distinguir deuda preexistente de regresiones introducidas.

Toda implementación debe entregar resumen de cambios, decisiones, comandos ejecutados, riesgos y tareas pendientes. No se deben realizar commits, merges ni pushes desde estos agentes salvo instrucción explícita.

## Comandos de referencia

```powershell
npm install
npm run generate
npm run typecheck
npm run lint
npm run build
npm run dev
```
