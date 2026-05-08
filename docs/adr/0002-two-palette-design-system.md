# ADR 0002 — Two-palette design system, scoped by audience

- **Status:** accepted
- **Date:** 2026-05-07
- **Supersedes (in part):** the single-palette implication of session-1 setup.

## Context

The brief splits Endo into two audience-shaped surfaces: a patient portal
(empathetic, plain-English, warm) and a clinician portal (data-dense,
NICE/ESHRE terminology, designed for a 30-second consult window). The two
audiences have different reading goals and different visual conventions.

In the first session a single warm/feminine palette (cream / aubergine /
clay / plum) was applied across the app. After seeing it on screen the user
supplied a second, saturated palette (royal-blue navy + blue crayola +
dodger blue + lavender web + mauve + aquamarine + max-yellow-red) intended
for the clinician CDSS surfaces.

## Decision

Two palettes, scoped by audience under a single token system.

- **Patient palette (default).** Cream `#FBF7F2` background, aubergine ink
  `#3B2A3F`, clay primary `#B85F3F`, plum accent `#8E4F6B`. Stored as
  `:root` CSS variables and as `--color-brand-*` brand tokens. This is the
  default theme on every page; no theme attribute required.
- **Clinician palette.** White background, navy ink `#16215B`, blue crayola
  primary `#0070FA`, dodger blue accent `#259CF4`, with mauve / aquamarine /
  yellow-red as supporting colours and lavender web `#E1EAF9` as the soft
  surface. Activates wherever an ancestor element carries
  `data-theme="clinician"`. The token names are `--color-clinician-*` and
  the same shadcn variables (`--background`, `--foreground`, `--primary`,
  etc.) are re-bound under the scope.
- **Destructive red `#D7263D`** is shared by both palettes. Red-flag triage
  banners use the dedicated `.red-flag-banner` utility class so urgent
  copy can never be themed into invisibility.
- **Warning amber** is palette-specific (`--color-brand-amber` warm vs
  `--color-clinician-amber` cool) but distinct from destructive in both.

Components consume the shadcn-style semantic variables (`bg-background`,
`text-foreground`, `bg-primary`, etc.) rather than hard-coded brand tokens.
Wrapping a layout in `data-theme="clinician"` flips the entire surface
without per-component theming.

## How to apply

- Patient routes (`/`, `/portal/...`, future patient-facing surfaces): no
  theme attribute. Default warm palette applies.
- Clinician routes (`/cdss/...`, the Rapid Answer Panel, future clinician
  surfaces): wrap the layout in `<div data-theme="clinician">` (or set
  `data-theme="clinician"` on the route's `<html>` via Next layout).
- Internal dev routes pick the theme that matches the surface they are
  previewing. The gateway sandbox lives under the clinician theme because
  the LLM gateway primarily serves clinician-facing tasks.
- The token definitions in `src/app/globals.css` are the canonical
  reference for each colour's intended role. (An earlier internal-only
  preview page at `/dev/palette` was removed once the palette decision was
  locked.)

## Tradeoffs and what we are not doing

- **No dark mode (yet).** The clinician palette is light-base by user
  decision. A dark variant of either palette is a future addition gated on
  user research.
- **No automatic theme inversion for embedded patient content shown to a
  clinician.** Example: a clinician viewing a patient's narrative
  verbatim. The default behaviour is to render the embedded content in the
  surrounding clinician palette (one consistent surface) rather than
  islanding the patient palette inside. Revisit if user testing surfaces
  confusion.
- **Component library is shadcn, deferred.** The decision to re-skin
  shadcn primitives against the warm palette holds; the palette decision
  is independent. Once the first feature lands that needs Card / Dialog /
  Sheet / Slider, the components are added with both themes verified.

## Consequences

- Adding a new clinician surface is one attribute (`data-theme="clinician"`)
  on the route layout. No per-component theme switching.
- Updating either palette is a single-file change in `globals.css`.
- `red-flag-banner` is intentionally hard-coded to the destructive red so
  no theme override can dilute it. This is a regulatory requirement, not a
  design preference.

## References

- `src/app/globals.css` — token definitions for both palettes.
- Brief sections "Voice and tone", "Design and accessibility".
