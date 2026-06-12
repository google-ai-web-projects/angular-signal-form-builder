## Context

The application currently relies on standard/generic UI layouts. To elevate the user experience, we are transitioning to a premium, photography-first design language inspired by Apple, based on the newly generated `DESIGN.md`.

## Goals / Non-Goals

**Goals:**
- Implement SF Pro Display/Text equivalents (using system-ui or Inter).
- Adopt a strict layout strategy favoring alternating tiles, edge-to-edge content, and substantial white space.
- Unify interactions under the "Action Blue" (`#0066cc`) accent color.
- Remove extraneous shadows and gradients, standardizing on a single product elevation drop-shadow.

**Non-Goals:**
- Refactoring backend APIs or core business logic.
- Adding complex new data workflows; this is strictly a UI/UX enhancement.

## Decisions

- **CSS Variables for Tokens**: All colors, typography settings, and spacing units from `DESIGN.md` will be codified as CSS custom properties in `src/styles.css`.
- **Inter as SF Pro Fallback**: Since SF Pro is restricted, we will use Inter with `font-feature-settings: "ss03"` and tight letter-spacing adjustments to replicate the "Apple tight" cadence on non-Apple platforms.
- **Component Modernization**: Buttons will be rebuilt to strictly follow the "pill" (`rounded-full`) or "compact utility" (`rounded-sm`) shapes, removing arbitrary component radii.

## Risks / Trade-offs

- **Risk**: Wide-ranging CSS changes could cause layout regressions in edge-case views.
  **Mitigation**: Visually audit all key routes and utilize the defined structural breakpoints (1440px, 1068px, 834px, 640px) to ensure responsiveness.
- **Risk**: Implementing tight typography might impact readability if applied incorrectly to body text.
  **Mitigation**: Strict adherence to the `DESIGN.md` rule: negative letter-spacing is reserved for display sizes (17px+), while body text remains legible.
