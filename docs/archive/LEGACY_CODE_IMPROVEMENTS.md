# Legacy Code Improvements

## Overview
This document tracks improvements needed for legacy code to align with the design token system and modern best practices.

## Priority Areas

### 1. **PerformanceBadge Component** (High Priority)
**File**: `src/shared/components/PerformanceBadge/PerformanceBadge.css`

**Issues**:
- Hardcoded spacing values (`0.375rem`, `0.75rem`, `0.5rem`) instead of `--space-*` tokens
- Hardcoded font sizes (`0.75rem`, `0.65rem`) instead of `--text-*` tokens
- Hardcoded RGB colors for all badge variants
- Hardcoded hex color codes
- Hardcoded letter spacing (`0.5px`) instead of `--tracking-*` tokens
- Missing design token integration for transitions

**Improvements Needed**:
- Replace all spacing with `--space-*` tokens
- Replace font sizes with `--text-xs`, `--text-sm` tokens
- Create semantic color tokens for badge variants or use existing semantic colors
- Use `--tracking-*` tokens for letter spacing
- Use `--transition-base` or `--duration-*` tokens

### 2. **Error Component** (High Priority)
**File**: `src/shared/components/Error/Error.module.css`

**Issues**:
- Hardcoded RGB values for shadows and overlays (`rgb(47 243 224 / 50%)`)
- Hardcoded rem values in clamp functions
- Hardcoded hex colors (`#ffffff`, `#e2e8f0`)
- Hardcoded rgba values for backgrounds
- Some hardcoded pixel values

**Improvements Needed**:
- Replace RGB overlays with `--overlay-cyan-medium`, `--overlay-cyan` tokens
- Replace hardcoded colors with `--text-primary`, `--text-secondary`
- Use `--glass-bg`, `--glass-border` for glass surfaces
- Use `--shadow-*` tokens for box shadows
- Replace hardcoded rem values with design tokens where possible

### 3. **NameGrid Component** (Medium Priority)
**File**: `src/shared/components/NameGrid/NameGrid.module.css`

**Issues**:
- Hardcoded rgba values (`rgba(255, 255, 255, 0.03)`, `rgba(255, 255, 255, 0.1)`)
- Hardcoded rem values (`4rem`, `2rem`, `1.5rem`, `0.5rem`)
- Hardcoded pixel value (`280px`, `400px`)
- Uses legacy `--spacing-md` instead of `--space-*` tokens

**Improvements Needed**:
- Replace rgba with `--glass-bg-light` or appropriate glass tokens
- Replace rem values with `--space-*` tokens
- Consider using design tokens for fixed widths or make them responsive

### 4. **SetupLayout Component** (Medium Priority)
**File**: `src/features/tournament/styles/SetupLayout.module.css`

**Issues**:
- Hardcoded pixel value (`56px`) for sticky top position
- Hardcoded z-index (`90`) instead of `--z-*` tokens
- Uses HSL color format that might not align with design tokens

**Improvements Needed**:
- Use `--z-sticky` or appropriate z-index token
- Replace hardcoded pixel with design token if applicable

### 5. **SetupCards Component** (Low Priority)
**File**: `src/features/tournament/styles/SetupCards.module.css`

**Issues**:
- Hardcoded pixel widths (`180px`, `200px`, `190px`, `160px`, `140px`)
- Hardcoded transition values
- Hardcoded z-index (`10`)

**Improvements Needed**:
- Consider using CSS custom properties for responsive card widths
- Use `--transition-*` tokens
- Use `--z-*` tokens for z-index

## Implementation Status

### ✅ Phase 1: High Priority Components (COMPLETED)
1. **PerformanceBadge** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens
   - Typography: `--text-xs`, `--font-weight-*` tokens
   - Colors: `color-mix()` with semantic color tokens (`--color-warning`, `--color-success`, `--color-error`, `--color-info`, `--color-neon-cyan`)
   - Transitions: `--transition-base`
   - Letter spacing: `--tracking-wide`
   - Border radius: `--radius-full`

2. **Error** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens in clamp functions
   - Typography: `--text-*`, `--font-weight-*` tokens
   - Colors: `--text-primary`, `--text-secondary`
   - Shadows: `--shadow-md`, `--text-shadow-sm`, `--text-shadow-lg`
   - Overlays: `--overlay-cyan-medium`, `--overlay-red-medium`
   - Glass surfaces: `--glass-bg-strong`, `--glass-border`, `--glass-blur`
   - Transforms: `--transform-hover-lift`, `--transform-hover-scale`
   - Transitions: `--transition-base`

### ✅ Phase 2: Medium Priority Components (COMPLETED)
3. **NameGrid** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens (replaced `4rem`, `2rem`, `0.5rem`)
   - Typography: `--text-2xl` for empty title
   - Glass surfaces: `--glass-bg-light`, `--glass-border` (replaced rgba values)
   - Transitions: `--transition-transform`, `--transition-opacity`, `--duration-*`, `--ease-standard`

4. **SetupLayout** ✅ - Refactored to use design tokens
   - Z-index: `--z-sticky` (replaced hardcoded `90`)
   - Glass surfaces: `--glass-bg-strong`, `--glass-border`, `--glass-blur`
   - Shadows: `--shadow-md`
   - Transitions: `--transition-base`

### ✅ Phase 3: Additional Components (COMPLETED)
5. **AppNavbar** ✅ - Refactored to use design tokens
   - Glass surfaces: `--glass-bg-light`, `--glass-border` (replaced rgba values)
   - Overlays: `--overlay-cyan`, `--overlay-cyan-medium`
   - Shadows: `--shadow-md`, `--text-shadow-sm`, `--text-shadow-lg`
   - Transforms: `--transform-hover-lift`, `--transform-hover-scale`
   - Colors: `color-mix()` with design tokens

6. **Toast** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens (replaced `8px`, `12px`, `10px`, `5px`)
   - Typography: `--text-sm`, `--font-weight-*` tokens
   - Colors: `color-mix()` with semantic color tokens (`--color-success`, `--color-error`, `--color-warning`, `--color-info`)
   - Glass surfaces: `--glass-bg-light`, `--glass-bg`, `--glass-border`
   - Z-index: `--z-toast` (replaced hardcoded `999`)
   - Overlays: `--overlay-light`, `--overlay-dark`
   - Border radius: `--radius-sm`, `--radius-md`, `--radius-full`
   - Transforms: `--transform-hover-scale`

7. **Loading** ✅ - Refactored to use design tokens
   - Glass surfaces: `--glass-bg-strong`, `--glass-blur` (replaced rgb overlay)

### ✅ Phase 4: Additional Shared Components (COMPLETED)
8. **EmptyState** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens (replaced `3rem`, `1.5rem`, `1rem`, `0.5rem`)
   - Typography: `--text-*`, `--font-weight-*` tokens
   - Glass surfaces: `--glass-bg-light`, `--glass-border`
   - Colors: `--text-primary`, `--text-secondary`

9. **SkeletonLoader** ✅ - Refactored to use design tokens
   - Colors: `--color-neutral-200` (replaced `#ddd`)
   - Glass surfaces: `--glass-border`, `--glass-bg-light` for shimmer effect
   - Spacing: `--space-*` tokens
   - Border radius: `--radius-sm`, `--radius-md`, `--radius-full`

10. **ValidatedInput** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens
   - Glass surfaces: `--glass-bg-light`, `--glass-bg`, `--glass-border`
   - Colors: `color-mix()` with `--color-error`, `--color-success`
   - Focus states: `--focus-ring`
   - Typography: `--text-base`, `--text-xs`, `--font-weight-medium`
   - Transitions: `--transition-base`

11. **ErrorBoundary** ✅ - Refactored to use design tokens
   - Spacing: `--space-*` tokens
   - Colors: `color-mix()` with `--color-error`, `--color-info`
   - Glass surfaces: `--glass-bg-light`
   - Typography: `--text-*`, `--font-weight-*`, `--font-mono`
   - Border radius: `--radius-sm`, `--radius-md`
   - Transitions: `--transition-base`

12. **Bracket** ✅ - Refactored to use design tokens
   - Overlays: `--overlay-light` (replaced hardcoded RGB)
   - Shadows: `--shadow-xs`, `--shadow-sm`, `--shadow-md`
   - Colors: `--color-neon-cyan` as fallback
   - Glass surfaces: `--glass-bg-light`

### ✅ Phase 5: Remaining Shared Components (COMPLETED)
13. **Card** ✅ - Refactored to use design tokens
   - Gradient colors: Replaced hardcoded hex with `color-mix()` using semantic color tokens
   - Primary/Info: `--color-info`
   - Success: `--color-success`
   - Warning: `--color-warning`
   - Danger/Error: `--color-error`
   - Secondary: `--color-neutral-*` tokens

14. **CardName** ✅ - Already using design tokens (minimal changes needed)

15. **CollapsibleHeader** ✅ - Refactored to use design tokens
   - Colors: `--color-neon-cyan` as fallback (replaced `#2ff3e0`)
   - Text colors: `--text-primary`, `--text-secondary` (removed hardcoded fallbacks)

16. **NameSuggestionModal** ✅ - Refactored to use design tokens
   - Overlays: `--overlay-cyan` (replaced `rgb(var(--primary-rgb) / 10%)`)
   - Error states: `color-mix()` with `--color-error`
   - Success states: `color-mix()` with `--color-success`
   - Colors: `color-mix()` for text colors

### Phase 6: Feature Components & Legacy Files
17. **SetupCards** - Less critical, can be improved incrementally
18. **Analysis components** - Feature-specific, lower priority
19. **Tournament components** - Some may have intentional hardcoded values
20. **Legacy files** - May not need updating

## Benefits

### Consistency
- All components will use the same design language
- Easier to maintain and update globally
- Better theme support

### Maintainability
- Single source of truth for design values
- Easier to make global changes
- Reduced code duplication

### Accessibility
- Better contrast ratios through theme tokens
- Consistent focus states
- Proper semantic color usage

### Performance
- CSS variables are more performant
- Better tree-shaking opportunities
- Reduced CSS bundle size

## Notes

- Some hardcoded values may be intentional (e.g., specific pixel widths for layout)
- Always test theme switching after changes
- Ensure contrast ratios meet WCAG AA standards
- Consider backward compatibility if components are used elsewhere
