# AccionaFleet Design System

## Purpose

This document defines the global design system for the AccionaFleet frontend migration from Microsoft Access.

The goal is consistency across all screens, forms, dialogs, tables, and detail panels while preserving the visual identity already present in the legacy application.

## Design Principles

1. Functional first
   - The interface must prioritize task completion over decoration.
   - Dense operational screens should remain scan-friendly.

2. Brand aligned
   - Use Acciona red, white, and black as the primary identity palette.
   - Neutral surfaces should support the brand, not compete with it.

3. Clear hierarchy
   - Every screen needs one dominant title, one primary action, and a predictable secondary action pattern.
   - Form labels, values, and actions must remain visually distinct.

4. Consistent patterns
   - Reuse the same page shell, table behavior, and detail panel structure across the product.
   - Avoid one-off visual treatments for individual modules.

5. Accessible by default
   - Maintain readable contrast, large enough touch targets, and keyboard operability.
   - Error states and disabled states must be explicit.

## Brand Palette

### Core colors

- Acciona Red: `#ED1C24`
- White: `#FFFFFF`
- Black: `#000000`

### Legacy evidence

- The legacy Access export uses a repeated title bar/header color of `BackColor = 2366701`, which converts to `#ED1C24`. This appears on forms such as `Employees`, `Drivers`, and `Expenses`. [Code]
- The same forms use white text on that red title bar via `ForeColor = 16777215` (`#FFFFFF`). [Code]
- The Access forms also use dark text values such as `ForeColor = 3484194` (`#222A35`) and `ForeColor = -2147483630`, which appear on action buttons and labels. [Code]
- The functional manual identifies AccionaFleet as an Acciona product for fleet operations and shows the Access UI structure around `Formulario Inicio`, `Menú Principal`, `Solicitudes`, `Sanciones / Otros`, `Parámetros`, and reporting screens. [Code]

### Supporting neutrals

- Surface background: `#FFFFFF`
- Elevated panel background: `#F7F8FA`
- Border / divider: `#D9DEE6`
- Primary text: `#000000`
- Secondary text: `#222A35`
- Muted text: `#5B6675`

### Semantic use

- Red: primary brand header, emphasized actions, warnings that need attention.
- White: base page background and content surfaces.
- Black: maximum-emphasis text and structural contrast.

## Typography

- Use a modern sans-serif system font for the migrated frontend.
- Hierarchy:
  - Page title: large, bold, high-contrast
  - Section title: medium-bold
  - Body: regular
  - Meta / helper text: smaller and muted

### Rules

- Keep labels short and operational.
- Use sentence case unless the domain term is already a proper noun or coded state.
- Do not rely on color alone to communicate meaning.

## Layout

### Page shell

- Single page header with title and short description.
- Main content area with either:
  - filter bar + data table, or
  - two-column master-detail layout for record-centric screens.
- Side panel for selected record details when the screen is information-dense.

### Spacing

- Use a simple spacing scale: 4, 8, 12, 16, 24, 32, 48.
- Keep internal form spacing tight enough for operational use, but not cramped.

### Grid

- Desktop: use a fluid content area with a practical max width.
- Tablet/mobile: collapse to stacked sections and make tables horizontally scrollable or progressive-disclosure based.

## Navigation

- Keep primary navigation stable and shallow.
- The legacy product is organized around operational modules such as:
  - requests
  - sanctions/incidents
  - Solred and Via T workflows
  - parameters/master data
  - reports
  - change tracking

## Components

### Buttons

- Primary button:
  - filled red background
  - white text
  - used for the main action on a screen
- Secondary button:
  - white or neutral background
  - dark border
  - used for cancel, reset, or non-destructive alternatives
- Destructive button:
  - black or red emphasis depending on context
  - always requires clear labeling

### Tables

- Use tables for high-density operational lists.
- Table behavior:
  - sticky header when useful
  - row hover
  - selectable rows
  - compact cell padding
  - right-side detail panel for inspection
- Keep column names short and domain-specific.

### Forms

- Group related fields visually.
- Prefer explicit labels above or beside inputs for dense admin screens.
- Use inline helper text for validations or domain constraints.

### Detail panels

- Use a fixed or anchored side panel for selected record details.
- Include a clear close action.
- Present fields in a predictable label-value format.

### Filter bars

- Put filtering and export actions near the top of list screens.
- Support clear, reset, and retry behaviors.

## Visual Language from Legacy Access

The legacy Access UI is consistent enough to define a stable visual baseline:

- Red title bands with white text are common across forms such as Employees, Drivers, and Sanciones / Varios. [Code]
- Many field labels use a pale neutral label background (`#EFF2F7`) to separate label chrome from editable values. [Code]
- Action buttons use dark text on light backgrounds, with some highlighted controls using stronger color treatment. [Code]
- The manual shows the product organized around operational forms and tabular views, which supports a list + detail interaction model in the new frontend. [Code]

## Accessibility

- Minimum contrast:
  - body text must remain legible on all surfaces
  - interactive controls must have visible focus states
- Keyboard:
  - every action reachable by mouse must also be reachable by keyboard
- Motion:
  - keep transitions short and functional
- Error handling:
  - show a concise explanation and a recovery path

## Content Rules

- Use the business language already present in AccionaFleet.
- Preserve domain terms such as:
  - Solicitudes
  - Sanciones / Varios
  - Flota Viva
  - Parámetros
  - Solred
  - Via T
- Keep labels in Spanish unless the product area already standardizes on English.

## Reporting and Export

- Exports must be discoverable from the relevant list or report screen.
- Export actions should be clearly separated from destructive actions.

## Design Tokens

Recommended foundation tokens for implementation:

- `color.brand.primary = #ED1C24`
- `color.brand.onPrimary = #FFFFFF`
- `color.surface.default = #FFFFFF`
- `color.surface.subtle = #F7F8FA`
- `color.text.primary = #000000`
- `color.text.secondary = #222A35`
- `color.border.default = #D9DEE6`
- `space.xs = 4`
- `space.sm = 8`
- `space.md = 16`
- `space.lg = 24`
- `radius.sm = 6`
- `radius.md = 10`
- `shadow.panel = subtle elevation for drawers and overlays`

## Recommended Screen Pattern

1. Header with module title and a short purpose line.
2. Toolbar with search, filters, and export actions.
3. Primary table or list.
4. Optional detail panel or inline inspector.
5. Empty, loading, and error states with obvious recovery actions.

## Pending Verification

- Exact Google Stitch `DESIGN.md` schema could not be verified from an official public Stitch document in this session. The document below follows the requested Stitch-style format and the evidence collected from the codebase and public coverage. [Web]
- Visual screenshots from the Access runtime were not directly capturable in this environment; legacy visual evidence comes from the exported Access form definitions and the functional manual. [Code]

## Sources

- [AccionaFleet functional manual](../legacy/ManualFuncional.md)
- [Employees Access form export](../legacy/access-export/forms/Employees.form.txt)
- [Drivers Access form export](../legacy/access-export/forms/Drivers.form.txt)
- [Expenses Access form export](../legacy/access-export/forms/Expenses.form.txt)
- [Google Labs Stitch coverage](https://www.theverge.com/news/670773/google-labs-stitch-ui-coding-design-tool)
- [Design systems practice paper](https://arxiv.org/abs/2205.10713)

