## ADDED Requirements

### Requirement: Action Pill Buttons
The system SHALL provide a primary action button component that renders as a capsule shape using the Action Blue color.

#### Scenario: Render primary button
- **WHEN** a primary button is rendered
- **THEN** it has `border-radius: 9999px`, `background-color: #0066cc`, and `transform: scale(0.95)` on active state.

### Requirement: Full-Bleed Product Tiles
The system SHALL support full-width layout sections that utilize alternating light, parchment, and dark backgrounds without rounding the container edges.

#### Scenario: Render dark product tile
- **WHEN** a dark product tile section is used
- **THEN** it occupies 100% viewport width, has `border-radius: 0`, and features `80px` vertical padding.

### Requirement: Global and Frosted Navigation
The system SHALL implement a pure black global navigation bar and an optional frosted-glass sub-navigation bar.

#### Scenario: Render frosted sub-navigation
- **WHEN** the user scrolls past the hero section
- **THEN** a sub-navigation bar with `backdrop-filter: blur(20px)` and 80% opacity parchment background appears.
