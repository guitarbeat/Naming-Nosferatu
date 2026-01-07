# Design Document: UI/UX Consolidation

## Overview

This design consolidates the UI/UX system for Naming Nosferatu by unifying documentation, completing the design token migration, and establishing consistent patterns across all components. The approach prioritizes backward compatibility while systematically replacing hardcoded values with token references.

## Architecture

### Current State

The UI/UX system is currently spread across:
- `docs/UI_UX.md` - Visual design guide
- `docs/ARCHITECTURE.md` - System design with UI sections
- `.agent/workflows/ui-ux.md` - Development workflow
- `src/shared/styles/design-tokens.css` - Token definitions
- `src/shared/styles/themes.css` - Theme variants
- `src/shared/styles/colors.css` - Color palette

### Target State

```
docs/
├── UI_UX.md                    # Consolidated reference (expanded)
└── ARCHITECTURE.md             # System design only (UI sections removed)

.agent/workflows/
└── ui-ux.md                    # Workflow only (design guidance removed)

src/shared/styles/
├── design-tokens.css           # Complete token system
├── themes.css                  # Theme-specific overrides
├── colors.css                  # Color palette (unchanged)
└── index.css                   # Import orchestration
```

## Components and Interfaces

### Documentation Structure

The consolidated `docs/UI_UX.md` will follow this structure:

```markdown
# UI/UX Design System

## Table of Contents
1. Design Tokens
2. Color System
3. Typography
4. Spacing
5. Glass Surfaces
6. Components
7. Accessibility
8. Theming
9. Migration Checklist

## 1. Design Tokens
[Token reference with usage examples]

## 2. Color System
[Brand colors, semantic colors, gradients]

...
```

### Token Migration Patterns

#### Z-Index Migration

Replace hardcoded values with semantic tokens:

```css
/* Before */
.card { z-index: 1; }
.modal { z-index: 100; }

/* After */
.card { z-index: var(--z-elevate); }
.modal { z-index: var(--z-modal); }
```

#### Spacing Migration

Replace hardcoded spacing with token references:

```css
/* Before */
.component { padding: 16px; margin: 8px; }

/* After */
.component { padding: var(--space-4); margin: var(--space-2); }
```

#### Breakpoint Migration

Replace hardcoded breakpoints with token references:

```css
/* Before */
@media (min-width: 768px) { ... }

/* After */
@media (min-width: var(--breakpoint-md)) { ... }
```

### Glass Surface Presets

Define three standard glass presets:

```css
/* Glass Light - Subtle background effect */
.glass-light {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

/* Glass Medium - Standard glassmorphism */
.glass-medium {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}

/* Glass Strong - Prominent glass effect */
.glass-strong {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur-strong));
  border: 1px solid var(--glass-border-hover);
  box-shadow: var(--glass-shadow-colored);
}
```

### Accessibility Patterns

#### Focus State Standard

```css
/* Standard focus ring for all interactive elements */
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* Touch target minimum */
.interactive {
  min-height: 48px;
  min-width: 48px;
}
```

#### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Data Models

No data models are required for this consolidation effort. All changes are to CSS and documentation files.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Z-Index Token Compliance

*For any* CSS file in the project, all z-index declarations should use token references (`--z-*`) rather than hardcoded numeric values.

**Validates: Requirements 2.1**

### Property 2: Spacing Token Compliance

*For any* CSS module file, spacing values (padding, margin, gap) should use `--space-*` tokens rather than hardcoded rem/px values.

**Validates: Requirements 2.4**

### Property 3: Breakpoint Token Compliance

*For any* media query in the project, breakpoint values should use `var(--breakpoint-*)` rather than hardcoded pixel values like `768px`.

**Validates: Requirements 2.5**

### Property 4: Glass Token Theme Parity

*For any* glass-related token (`--glass-*`), the token should be defined in both the light theme and dark theme blocks in `themes.css`.

**Validates: Requirements 3.3**

### Property 5: Focus State Token Compliance

*For any* interactive element with a `:focus-visible` or `:focus` pseudo-class, the focus styling should use `--focus-ring` or related focus tokens.

**Validates: Requirements 4.1, 4.4**

### Property 6: Touch Target Minimum Size

*For any* interactive element (button, link, input), the element should have a minimum touch target of 48px in both height and width.

**Validates: Requirements 4.2**

### Property 7: Reduced Motion Respect

*For any* animation or transition in the project, there should be a corresponding `prefers-reduced-motion` media query that disables or reduces the animation.

**Validates: Requirements 4.3**

### Property 8: CSS Module Co-location

*For any* React component file, if the component uses CSS modules, the `.module.css` file should exist in the same directory as the component.

**Validates: Requirements 5.2**

### Property 9: Theme Transition Token Usage

*For any* CSS rule that applies theme-related transitions (background-color, color, border-color on theme change), the transition should use `var(--transition-theme)`.

**Validates: Requirements 6.4**

## Error Handling

### Migration Errors

When migrating hardcoded values to tokens:
1. If a value doesn't map to an existing token, create a new semantic token
2. Document any new tokens in the design tokens file with clear comments
3. Ensure backward compatibility by keeping deprecated values temporarily

### Theme Fallbacks

All theme-aware tokens should include fallback values:

```css
/* With fallback for older browsers */
background: var(--glass-bg, rgba(15, 23, 42, 0.55));
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific migration examples:
- Verify `SetupCards.module.css` uses responsive card width tokens
- Verify `SetupSwipe.module.css` uses color tokens
- Verify `useMasonryLayout` hook uses design tokens
- Verify consolidated documentation contains required sections

### Property-Based Tests

Property-based tests will use static analysis to verify token compliance across all files:

**Testing Framework**: Custom Node.js scripts using regex patterns and AST parsing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: ui-ux-consolidation, Property {N}: {description}**

**Property Test Approach**:

For CSS compliance properties (1-3, 5, 7, 9):
- Parse all CSS/SCSS files in `src/`
- Extract relevant declarations (z-index, spacing, breakpoints, focus, transitions)
- Verify each declaration uses token references

For structural properties (4, 8):
- Enumerate all relevant files
- Verify required patterns exist

For accessibility properties (6):
- Parse interactive element styles
- Verify minimum size constraints

### Dual Testing Approach

- **Unit tests**: Verify specific files are correctly migrated
- **Property tests**: Verify universal compliance across all files
- Both are complementary and necessary for comprehensive coverage
