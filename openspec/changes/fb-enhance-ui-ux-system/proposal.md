## Why

The current app's UI/UX can be significantly elevated by adopting a premium, photography-first design system. Inspired by Apple's design language, this change aims to reduce UI chrome, focus on content with edge-to-edge product tiles, and implement precise typography and spacing. This will result in a more memorable, highly crafted, and cohesive user experience.

## What Changes

- Full integration of the Apple-inspired design system (`DESIGN.md`) into the application.
- Implementation of a strict typography hierarchy mimicking SF Pro Display/Text patterns.
- Adoption of alternating full-bleed tiles (light/dark/parchment) for section rhythms.
- Refactoring existing buttons to the new capsule/pill and compact utility grammar.
- Removal of decorative gradients and generic shadows, replacing them with a single purposeful drop-shadow for elevated imagery.
- Implementation of frosted-glass sub-navigation and floating sticky bars.

## Capabilities

### New Capabilities
- `apple-design-system`: Core foundation including design tokens, spacing scale, strict typography rules, and the refined color palette.
- `apple-ui-components`: Shared components including `global-nav`, `sub-nav-frosted`, `product-tile`, and signature `button-primary` pills.

### Modified Capabilities
- (None)

## Impact

- Global CSS and component library modifications.
- Updates to all main view layouts to accommodate edge-to-edge tiling and new spacing rules.
- Potential updates to asset handling to support responsive, high-fidelity imagery suited for this design language.
