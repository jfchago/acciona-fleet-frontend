# Design system adoption checklist

This checklist is the validation contract for new and migrated AccionaFleet screens. It complements the visual contract in `DESIGN.md` without changing that source document.

## Required baseline

- Use the global tokens from `app/globals.css`; do not introduce one-off colors, spacing, radii, shadows, or focus treatments.
- Follow the page hierarchy: one page title, concise purpose line, clear primary action, and predictable secondary actions.
- Use sentence case and established AccionaFleet domain language.
- Reuse the operational patterns for shell, filters, tables/lists, forms, details, export, loading, empty, and error states.
- Provide visible keyboard focus, keyboard access for every action, semantic labels, and responsive behavior.
- Verify contrast, desktop and mobile layouts, and recovery paths for error states.

## Classification

- **Compliant**: meets the baseline and uses the shared patterns without local exceptions.
- **Exception**: differs only for a documented functional reason; the common pattern remains in use wherever applicable.
- **Migrate next**: an existing screen has meaningful visual or interaction drift and is queued for a future migration slice.

## Current adoption

| Screen | Classification | Evidence / follow-up |
| --- | --- | --- |
| Flota Viva | Compliant | Reference implementation for shell, filters, export, table, paging, detail, and UI states. |
| Inicio | Migrate next | Existing seed content should adopt the operational shell and content hierarchy in a future slice. |

New screens are compliant by default. Existing screens migrate progressively after the Flota Viva baseline is accepted; this checklist does not block unrelated delivery.
