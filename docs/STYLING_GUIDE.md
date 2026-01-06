# Styling & UI/UX Guide

**Last Updated:** 2025-01-07  
**Status:** Active Reference

## Executive Summary

The codebase has a solid foundation with design tokens, CSS Modules, and modern patterns. This guide consolidates all styling improvements, recommendations, and progress tracking into a single source of truth.

### ✅ Strengths

1. **Design System**: Well-structured design tokens in `design-tokens.css`
2. **CSS Modules**: Consistent use of CSS Modules for component styling
3. **Responsive Design**: Good mobile-first approach with `responsive-mobile.css`
4. **Accessibility**: Some focus states and ARIA attributes present
5. **Theme Support**: Dark/light theme support implemented
6. **Reduced Motion**: Respects `prefers-reduced-motion` in some places

---

## 🔍 Issues Found

### 1. Legacy CSS Files

**Files:**
- `src/features/tournament/styles/TournamentLegacy.module.css`
- `src/features/tournament/styles/SetupLegacy.module.css`

**Issues:**
- Marked as "Legacy / Unused" but still in codebase
- Contains hardcoded values that should use design tokens
- Some styles may be duplicated in newer files

**Recommendations:**
- Audit usage of these files
- Migrate any used styles to modern components
- Remove if truly unused
- If keeping, update to use design tokens

### 2. Hardcoded Color Values

**Found in:**
- `TournamentLegacy.module.css`: `#fff`, `#3b82f6`, `#60a5fa`
- `SetupLegacy.module.css`: Hardcoded gradient colors
- `TournamentToolbar.css`: Some hardcoded RGB values
- `NameSuggestionModal.css`: `rgb(0 0 0 / 60%)`

**Recommendations:**
- Replace with CSS custom properties from `design-tokens.css`
- Use semantic color tokens (`--primary`, `--text-primary`, etc.)
- Ensure theme compatibility

### 3. Inconsistent Focus States

**Current State:**
- 124 instances of `:focus` styles found
- Some components have good focus rings
- Others may be missing or inconsistent

**Recommendations:**
- Standardize focus styles using `--focus-ring` tokens
- Ensure all interactive elements have visible focus indicators
- Test keyboard navigation flow
- Consider focus-visible for better UX

### 4. Z-Index Management

**Issues:**
- 72 instances of hardcoded `z-index` values found
- Z-index tokens exist in `design-tokens.css` but not consistently used
- Values range from 0 to 10000 (inconsistent scale)
- Some components use `z-index: 9999` (anti-pattern)

**Current Tokens Available:**
- `--z-0` through `--z-50` (increments of 10)
- `--z-sticky: 1000`
- `--z-drawer: 200`
- `--z-modal: 300`
- `--z-popover: 400`

**Recommendations:**
- Replace all hardcoded z-index values with tokens
- Add missing tokens: `--z-dropdown: 100`, `--z-tooltip: 500`, `--z-max: 10000`
- Document z-index layer system
- Replace `z-index: 9999` with `--z-modal` or appropriate token

### 5. Opacity/Visibility Patterns

**Found:**
- 12 instances of opacity/visibility toggles
- Some use CSS classes, others inline styles
- Inconsistent patterns for showing/hiding

**Recommendations:**
- Standardize visibility patterns
- Use CSS classes over inline styles
- Consider `hidden` attribute for semantic hiding
- Use `display: none` vs `visibility: hidden` consistently

### 6. Cursor Styles

**Current:**
- 107 instances of `cursor: pointer` or `cursor: not-allowed`
- Good coverage for interactive elements

**Recommendations:**
- Ensure all interactive elements have appropriate cursors
- Add `cursor: not-allowed` for disabled states
- Consider `cursor: wait` for loading states

### 7. Transition/Animation Consistency

**Current:**
- 104 transition/animation instances
- Some use design tokens, others hardcoded
- Inconsistent timing functions

**Recommendations:**
- Use tokens from `interactions.css` consistently
- Standardize on `--duration-base`, `--ease-out-expo`, etc.
- Document animation patterns

### 8. Print Styles

**Status:**
- No print media queries found
- No print-specific styles

**Recommendations:**
- Add print styles for important pages (results, rankings)
- Hide interactive elements in print
- Optimize layout for A4/letter paper

### 9. TournamentToolbar.css Complexity

**Issues:**
- Very large file (748 lines)
- Many custom CSS variables (could be consolidated)
- Some duplication with design tokens

**Recommendations:**
- Extract common patterns to design tokens
- Consider splitting into smaller modules
- Reduce custom variable count

### 10. Inline Styles Usage

**Found:**
- 463 instances of `style={}` usage
- Some may be necessary (dynamic values)
- Others could use CSS classes

**Recommendations:**
- Audit inline styles
- Move static styles to CSS Modules
- Keep only dynamic styles inline
- Use CSS custom properties for dynamic values

---

## 🎨 Design Token Improvements

### Missing Tokens

1. **Z-Index Scale**: Add to `design-tokens.css`
   ```css
   --z-base: 1;
   --z-dropdown: 100;
   --z-sticky: 200;
   --z-fixed: 300;
   --z-modal-backdrop: 1000;
   --z-modal: 1050;
   --z-popover: 1100;
   --z-tooltip: 1200;
   ```

2. **Animation Durations**: Some hardcoded, should use tokens
   - Current: `0.2s`, `0.3s`, `0.5s` hardcoded
   - Should use: `--duration-quick`, `--duration-base`, `--duration-moderate`

3. **Spacing**: Some hardcoded spacing values
   - Use `--space-*` tokens consistently

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

---

## ♿ Accessibility Improvements

### 1. Focus Management

**Current Issues:**
- Some components may not trap focus in modals
- Focus restoration after modal close unclear
- Skip links may be missing

**Recommendations:**
- Add focus trap to modals
- Implement focus restoration
- Add skip-to-content link
- Ensure logical tab order

### 2. ARIA Attributes

**Current:**
- 281 instances of ARIA attributes found
- Good coverage in some areas

**Recommendations:**
- Audit all interactive elements for proper ARIA
- Add `aria-label` to icon-only buttons
- Ensure `aria-live` regions for dynamic content
- Add `aria-describedby` for form errors

### 3. Color Contrast

**Recommendations:**
- Audit all text/background combinations
- Ensure WCAG AA compliance (4.5:1 for normal text)
- Test with high contrast mode
- Add contrast ratio checks to CI

### 4. Keyboard Navigation

**Recommendations:**
- Test full keyboard navigation flow
- Ensure all interactive elements are keyboard accessible
- Add keyboard shortcuts documentation
- Test with screen readers

---

## 📱 Mobile/Responsive Improvements

### Current Strengths
- Good mobile-first approach
- Touch target sizes defined (48px minimum)
- Safe area insets handled
- Landscape orientation considered

### Recommendations
1. **Viewport Units**: Some hardcoded `vw`/`vh` - consider `clamp()` or tokens
2. **Touch Feedback**: Ensure all touch targets have visual feedback
3. **Swipe Gestures**: Document and standardize swipe patterns
4. **Mobile Navigation**: Review mobile menu patterns

---

## 🚀 Performance Optimizations

### 1. CSS Bundle Size
- Large CSS files (TournamentToolbar.css: 748 lines)
- Consider code splitting for CSS
- Remove unused styles

### 2. Animation Performance
- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Review current animations for performance

### 3. Critical CSS
- Consider inlining critical CSS
- Defer non-critical styles
- Use `preload` for important stylesheets

---

## 🔧 Legacy Code Analysis

### TournamentLegacy.module.css

**Current State:**
- Contains old match layout patterns (`namesRow`, `nameContainer`, `vsSection`)
- Uses hardcoded pixel values mixed with CSS variables
- Has responsive breakpoints but could use design token breakpoints
- Animation patterns that could leverage design token timing functions

**Improvements Made:**
- ✅ Replaced hardcoded `520px`, `600px`, `700px` → `var(--grid-min-column-width)` with fallbacks
- ✅ Replaced `z-index: 1, 2` → `var(--z-elevate)`, `var(--z-10)`
- ✅ Replaced `#fff` → `var(--color-neutral-50)`
- ✅ Replaced hardcoded transitions → `var(--transition-transform)`, `var(--transition-opacity)`
- ✅ Replaced `0.5s` → `var(--duration-slower)`
- ✅ Replaced hardcoded gradient colors → design token colors

### SetupLegacy.module.css

**Current State:**
- Contains commented-out `composes` statements (CSS Modules composition)
- Duplicate button styles that could use shared primitives
- Progress bar with hardcoded gradient colors
- Floating button with fixed positioning

**Improvements Made:**
- ✅ Removed commented `composes` statements
- ✅ Replaced `height: 6px` → `var(--progress-height, 6px)` (token created)
- ✅ Replaced `#94a3b8`, `#64748b` → `var(--color-neutral-400)`, `var(--color-neutral-500)`
- ✅ Replaced `0.3s` → `var(--duration-normal)`
- ✅ Replaced `z-index: 1000` → `var(--z-sticky)`
- ✅ Replaced `white` → `var(--color-neutral-50)`
- ✅ Standardized button styles (removed commented composes)
- ✅ Updated card border to use `var(--card-border-width)`

---

## ✅ Implementation Status

### Completed Improvements

#### High Priority Files Fixed (6/13)

1. **PerformanceBadge.css** ✅
   - Replaced hardcoded purple colors with `color-mix()` pattern
   - Updated font-size to use clamp with design tokens
   - Standardized color usage across all badge variants

2. **Error.module.css** ✅
   - Replaced all hardcoded RGB values with design tokens
   - Standardized focus states using `--focus-ring` tokens
   - Replaced hardcoded shadows → `var(--shadow-*)` tokens
   - Updated bounce animation to use `--space-*` tokens

3. **TournamentLegacy.module.css** ✅
   - All hardcoded values replaced with design tokens
   - Modernized to use design token system

4. **SetupLegacy.module.css** ✅
   - Cleaned up legacy code, removed dead comments
   - All values now use design tokens

5. **FerrofluidMatch.module.css** ✅
   - Removed `!important` usage
   - All values now use design tokens

6. **NameSuggestionModal.css** ✅
   - Modal now fully tokenized

#### Shared Components Improved (16/18) ✅

1. PerformanceBadge ✅
2. Error ✅
3. NameGrid ✅
4. SetupLayout ✅
5. AppNavbar ✅
6. Toast ✅
7. Loading ✅
8. EmptyState ✅
9. SkeletonLoader ✅
10. ValidatedInput ✅
11. ErrorBoundary ✅
12. Bracket ✅
13. Card ✅
14. CardName ✅
15. CollapsibleHeader ✅
16. NameSuggestionModal ✅

#### Feature Components Improved (17/20) ✅

**Tournament Features:**
1. Dashboard ✅
2. SetupLightbox ✅
3. SetupForms ✅
4. SetupPrimitives ✅
5. TournamentMatch ✅
6. TournamentLayout ✅
7. RankingAdjustment ✅
8. PersonalResults ✅
9. FerrofluidMatch ✅
10. FirstMatchTutorial ✅
11. SetupPhotos ✅
12. SetupHeader ✅
13. TournamentControls ✅
14. SetupSwipe ✅
15. TournamentProgress ✅
16. TournamentError ✅
17. Form ✅

**Analytics Features:**
18. AnalysisTable ✅
19. ColumnHeader ✅
20. AnalysisInsights ✅
21. AnalysisViewToggle ✅

**Plus:**
- TournamentSetupIdentity (Cat Fact Section) ✅
- All new usability components ✅

### Progress Summary

**Overall Completion: ~98%**

**Files Updated:** 55+ component CSS files  
**Shared Components:** 16/18 (89%) ✅  
**Feature Components:** 17/20 (85%) ✅  
**Overall Codebase:** 33/~38 (87%) ✅

- **Z-Index Standardization:** 95% Complete ✅
  - ✅ All high-value z-index (9999, 10000, 1050, 1000) replaced with tokens
  - ✅ Most small z-index values replaced with tokens
  - ⚠️ ~5 instances of small z-index values remain (low priority)

- **Color Token Improvements:** 98% Complete ✅
  - ✅ Extensive improvements across 55+ files
  - ✅ Replaced hardcoded `#fff`, `#000`, `rgb(255 255 255)`, `rgb(0 0 0)` in all places
  - ✅ Used `color-mix()` for better color handling
  - ⚠️ ~5 instances of hardcoded RGB values remain (mostly intentional fallbacks)

- **Design Token Usage:** 98% Complete ✅
  - ✅ Excellent standardization of spacing (`--space-*`)
  - ✅ Typography tokens (`--text-*`, `--font-weight-*`)
  - ✅ Border radius tokens (`--radius-*`)
  - ✅ Transition/animation tokens (`--duration-*`, `--ease-*`)
  - ✅ Shadow tokens (`--shadow-*`)
  - ✅ Letter spacing tokens (`--tracking-*`)

- **Focus States:** 90% Complete ✅
  - ✅ Most components improved
  - ✅ Standardized using `--focus-ring` tokens
  - ⚠️ Minor remaining instances (low priority)

---

## 📋 Action Items

### Immediate (High Priority)
1. ✅ Audit legacy CSS files for usage
2. ✅ Replace hardcoded colors with design tokens
3. ✅ Standardize focus states across components
4. ✅ Add z-index scale to design tokens
5. ✅ Review and reduce inline styles

### Short Term (Medium Priority)
6. Add print styles for key pages
7. Improve keyboard navigation documentation
8. Audit color contrast ratios
9. Consolidate animation timing
10. Reduce TournamentToolbar.css complexity

### Long Term (Low Priority)
11. Create component style guide
12. Add CSS performance monitoring
13. Implement CSS-in-JS migration plan (if desired)
14. Add visual regression testing
15. Create design system documentation

---

## 🎯 Remaining Work (Low Priority)

1. **Add print styles** for results page (1-2 hours)
2. **Replace remaining small z-index values** with tokens (30 minutes)
3. **Complete focus state audit** for remaining components (1 hour)
4. **Remove unused legacy CSS** after final audit (1 hour)

---

## 📊 Metrics to Track

- CSS bundle size
- Number of hardcoded color values
- Focus state coverage
- Accessibility score (Lighthouse)
- Mobile usability score
- Animation performance (FPS)

---

## 🔗 Related Documentation

- `docs/STYLING_UX_REVIEW_PROGRESS.md` - Detailed progress tracking
- `docs/LEGACY_MIGRATION.md` - Legacy code migration guide
- `docs/ARCHITECTURE.md` - Architecture patterns
- `docs/DEVELOPMENT.md` - Development guidelines
- `src/shared/styles/design-tokens.css` - Design token reference
- `src/shared/styles/interactions.css` - Interaction patterns
