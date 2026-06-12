## ADDED Requirements

### Requirement: Design Token Implementation
The system SHALL provide a comprehensive set of CSS variables that map exactly to the colors, spacing, and typography scale defined in the Apple-inspired DESIGN.md.

#### Scenario: Verify color tokens
- **WHEN** the application stylesheet is loaded
- **THEN** the root element contains `--color-primary: #0066cc` and corresponding semantic tokens.

### Requirement: Typography Scale and Tracking
The system SHALL use 'Inter' (or native system-ui/SF Pro on Apple devices) with specific tracking, line-heights, and weights to mimic the exact Apple typographic hierarchy.

#### Scenario: Display headlines spacing
- **WHEN** a hero display text is rendered
- **THEN** it has `letter-spacing: -0.28px` and `font-weight: 600`.

#### Scenario: Body text sizing
- **WHEN** default paragraph text is rendered
- **THEN** it has `font-size: 17px` and `line-height: 1.47`.
