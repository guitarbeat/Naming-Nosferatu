# Legacy Code Migration Guide

**Last Updated:** 2025-01-07  
**Status:** Active Reference

## Overview

This document tracks improvements needed for legacy code to align with the design token system and modern best practices. It consolidates legacy code analysis and masonry layout improvements.

---

## Priority Areas

### 1. **PerformanceBadge Component** ✅ COMPLETED

**File**: `src/shared/components/PerformanceBadge/PerformanceBadge.css`

**Status:** ✅ Fully refactored to use design tokens
- Spacing: `--space-*` tokens
- Typography: `--text-xs`, `--font-weight-*` tokens
- Colors: `color-mix()` with semantic color tokens
- Transitions: `--transition-base`
- Letter spacing: `--tracking-wide`
- Border radius: `--radius-full`

### 2. **Error Component** ✅ COMPLETED

**File**: `src/shared/components/Error/Error.module.css`

**Status:** ✅ Fully refactored to use design tokens
- Spacing: `--space-*` tokens in clamp functions
- Typography: `--text-*`, `--font-weight-*` tokens
- Colors: `--text-primary`, `--text-secondary`
- Shadows: `--shadow-md`, `--text-shadow-sm`, `--text-shadow-lg`
- Overlays: `--overlay-cyan-medium`, `--overlay-red-medium`
- Glass surfaces: `--glass-bg-strong`, `--glass-border`, `--glass-blur`
- Transforms: `--transform-hover-lift`, `--transform-hover-scale`
- Transitions: `--transition-base`

### 3. **NameGrid Component** ✅ COMPLETED

**File**: `src/shared/components/NameGrid/NameGrid.module.css`

**Status:** ✅ Fully refactored to use design tokens
- Spacing: `--space-*` tokens (replaced `4rem`, `2rem`, `0.5rem`)
- Typography: `--text-2xl` for empty title
- Glass surfaces: `--glass-bg-light`, `--glass-border` (replaced rgba values)
- Transitions: `--transition-transform`, `--transition-opacity`, `--duration-*`, `--ease-standard`

### 4. **SetupLayout Component** ✅ COMPLETED

**File**: `src/features/tournament/styles/SetupLayout.module.css`

**Status:** ✅ Fully refactored to use design tokens
- Z-index: `--z-sticky` (replaced hardcoded `90`)
- Glass surfaces: `--glass-bg-strong`, `--glass-border`, `--glass-blur`
- Shadows: `--shadow-md`
- Transitions: `--transition-base`

### 5. **SetupCards Component** ⚠️ PENDING

**File**: `src/features/tournament/styles/SetupCards.module.css`

**Issues:**
- Hardcoded pixel widths (`180px`, `200px`, `190px`, `160px`, `140px`)
- Hardcoded transition values
- Hardcoded z-index (`10`)

**Improvements Needed:**
- Consider using CSS custom properties for responsive card widths
- Use `--transition-*` tokens
- Use `--z-*` tokens for z-index

---

## Masonry Layout

### ✅ Recently Implemented

- ✅ Created `useMasonryLayout` hook for dynamic card positioning
- ✅ Updated `NameGrid` and `ModernTournamentSetup` to use masonry
- ✅ Cards now flow into shortest column automatically
- ⚠️ **Needs**: Design token integration (currently uses hardcoded values)

### Quick Wins

**Replace Hardcoded Values in Masonry CSS**

**Files:** `SetupCards.module.css`, `NameGrid.module.css`

**Current Issues:**
- Hardcoded pixel widths: `180px`, `200px`, `190px`, `160px`, `140px`
- Hardcoded transition durations: `0.2s`, `0.3s`
- Hardcoded z-index: `10`

**Improvements:**
```css
/* BEFORE */
.cardsContainer > * {
  width: 180px;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

/* AFTER - Use design tokens */
.cardsContainer > * {
  width: var(--card-width-base, 180px);
  transition: var(--transition-transform);
  z-index: var(--z-elevated, 10);
}
```

**Action:** Create card width tokens and use existing transition/z-index tokens

---

## Design Token Utilization

### Underutilized Tokens

**Found in `design-tokens.css` but not widely used:**

1. **Responsive Text Sizes:**
   ```css
   --text-responsive-xs: clamp(0.75rem, 1.5vw, 0.875rem);
   --text-responsive-sm: clamp(0.875rem, 1.75vw, 1rem);
   ```
   **Recommendation:** Replace fixed font sizes in legacy components with responsive variants

2. **Spring Easing:**
   ```css
   --spring-easing: linear(...);
   --spring-duration: 1.33s;
   ```
   **Recommendation:** Use for more natural animations in card interactions

3. **Glass Surface Tokens:**
   ```css
   --glass-blur: 20px;
   --glass-blur-strong: 30px;
   ```
   **Recommendation:** Apply to modals, overlays, and elevated surfaces

### Missing Token Opportunities

**Create new tokens for common patterns:**

1. **Card Match Layout:**
   ```css
   --match-card-min-width: 320px;
   --match-card-max-width: 600px;
   --match-vs-size: clamp(36px, 7vw, 52px);
   ```

2. **Progress Indicators:**
   ```css
   --progress-height: 6px;
   --progress-border-radius: var(--radius-full);
   --progress-gradient: linear-gradient(90deg, var(--secondary-400), var(--secondary-600));
   ```

3. **Floating Actions:**
   ```css
   --floating-button-size: 56px;
   --floating-button-offset: var(--space-6);
   --floating-button-z-index: var(--z-sticky);
   ```

---

## Hardcoded Values to Replace

### Pixel Values

**Found in legacy files:**
- `520px`, `600px`, `700px` → Use `--grid-min-column-width` or create card width tokens
- `6px` (progress bar) → Use `--progress-height` token
- `60px`, `100px`, `120px` (VS section) → Use responsive clamp with tokens

### Color Values

**Found hardcoded colors:**
- `#94a3b8`, `#64748b` → Use `--secondary-400`, `--secondary-500`
- `rgb(59 130 246 / 30%)` → Use `--color-info` with opacity or create token
- `#fff` → Use `--color-neutral-50` or theme-aware token

### Animation Values

**Found hardcoded durations:**
- `0.3s`, `0.4s`, `0.5s` → Use `--duration-*` tokens
- `ease-out` → Use `--ease-out` or `--ease-standard`

---

## CSS Architecture Improvements

### Composition Patterns

**Current Issue:** Commented-out `composes` statements suggest incomplete migration

**Solution Options:**

**Option A: CSS Modules Composition (if supported)**
```css
/* SetupPrimitives.module.css */
.surfaceCard {
  background: var(--surface-color);
  border: var(--card-border-width) solid var(--border-color);
  border-radius: var(--radius-card);
  padding: var(--card-padding-md);
}

/* Usage */
.startSection {
  composes: surfaceCard stack stackGapSm from "./SetupPrimitives.module.css";
}
```

**Option B: Design Token Approach (Recommended)**
```css
/* Use tokens directly - no composition needed */
.startSection {
  background: var(--surface-color);
  border: var(--card-border-width) solid var(--border-color);
  border-radius: var(--radius-card);
  padding: var(--card-padding-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component-gap);
}
```

### Button Style Consolidation

**Current:** Duplicate button styles in `SetupLegacy.module.css`

**Improvement:**
```css
/* Create shared button base in SetupPrimitives.module.css */
.buttonBase {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-icon-gap);
  padding: var(--button-padding-y-md) var(--button-padding-x-md);
  font-size: var(--text-base);
  font-weight: var(--button-font-weight);
  line-height: var(--leading-tight);
  border: var(--button-border-width) solid transparent;
  border-radius: var(--button-border-radius);
  transition: var(--transition-base);
  min-height: var(--button-height-md);
  cursor: pointer;
}
```

---

## Responsive Design Improvements

### Breakpoint Consistency

**Current:** Mixed breakpoint patterns
```css
/* Inconsistent */
@media (width <= 768px) { }
@media (width >= 1920px) { }
```

**Improvement:** Use design token breakpoints
```css
/* Consistent */
@media (width <= var(--breakpoint-md)) { }
@media (width >= var(--breakpoint-2xl)) { }
```

### Clamp Function Standardization

**Current:** Various clamp patterns
```css
width: clamp(36px, 7vw, 52px);
font-size: clamp(var(--text-sm), 2vw, var(--text-base));
```

**Improvement:** Create semantic tokens
```css
:root {
  --vs-section-size: clamp(36px, 7vw, 52px);
  --vs-text-size: clamp(var(--text-sm), 2vw, var(--text-base));
}
```

---

## Animation & Transition Improvements

### Standardize Animation Patterns

**Current:** Various animation definitions
```css
@keyframes fadeInSlide {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Improvement:** Use design token timing
```css
@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(var(--space-2));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeInSlide var(--duration-normal) var(--ease-out);
}
```

### Leverage Spring Easing

**Opportunity:** Use `--spring-easing` for more natural card interactions
```css
.card {
  transition: transform var(--spring-duration) var(--spring-easing);
}

.card:hover {
  transform: var(--transform-hover-lift);
}
```

---

## Color System Improvements

### Replace Hardcoded Colors

**Found in legacy files:**
```css
/* BEFORE */
background: linear-gradient(135deg, #3b82f6, #60a5fa);
border: 1px solid rgb(59 130 246 / 30%);

/* AFTER */
background: linear-gradient(135deg, var(--color-info), var(--primary-400));
border: var(--card-border-width) solid rgb(var(--neon-cyan-rgb) / 30%);
```

### Use Gradient Tokens

**Available but underused:**
```css
/* Use existing tokens */
background: var(--gradient-primary);
/* or */
background: var(--gradient-vibrant);
```

---

## Migration Strategy

### Phase 1: Token Creation
1. Add missing tokens to `design-tokens.css`:
   - Match layout tokens
   - Progress indicator tokens
   - Floating action tokens

### Phase 2: Legacy File Updates
1. Update `TournamentLegacy.module.css` to use tokens ✅
2. Update `SetupLegacy.module.css` to remove comments and use tokens ✅
3. Fix `!important` in `FerrofluidMatch.module.css` ✅

### Phase 3: Component Updates
1. Update components using legacy styles
2. Test responsive behavior
3. Verify design consistency

### Phase 4: Cleanup
1. Remove unused legacy styles
2. Consolidate duplicate patterns
3. Document token usage patterns

---

## Quick Wins

**Immediate improvements (low effort, high impact):**

1. **Replace hardcoded colors** (5 min per file)
   ```css
   /* Find: #94a3b8 */
   /* Replace: var(--secondary-400) */
   ```

2. **Use transition tokens** (2 min per file)
   ```css
   /* Find: transition: transform 0.3s ease-out */
   /* Replace: transition: var(--transition-transform) */
   ```

3. **Remove `!important`** (5 min)
   - Increase selector specificity instead

4. **Use spacing tokens** (10 min per file)
   ```css
   /* Find: padding: 16px */
   /* Replace: padding: var(--space-4) */
   ```

---

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

---

## Notes

- Some hardcoded values may be intentional (e.g., specific pixel widths for layout)
- Always test theme switching after changes
- Ensure contrast ratios meet WCAG AA standards
- Consider backward compatibility if components are used elsewhere

---

## Related Documentation

- `docs/STYLING_GUIDE.md` - Comprehensive styling guide (includes all styling improvements)
- `docs/USABILITY_GUIDE.md` - Usability recommendations
- `docs/ARCHITECTURE.md` - Architecture patterns
- `docs/DEVELOPMENT.md` - Development guidelines
