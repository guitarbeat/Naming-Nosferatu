# 01-problems-and-friction.md

## Problems and Friction Analysis

This document identifies concrete problems that hinder development velocity, code maintainability, and user experience. Each problem includes evidence from the codebase, impact assessment, and leverage ranking.

## Problem 1: Bundle Size Optimization Blockers

**Description:** The application exceeds its bundle size target (391KB vs 368KB goal) due to redundant dependencies and inefficient imports.

**Evidence:**
- **Dual icon libraries**: Both `lucide-react` (562KB) and `@heroicons/react` (2KB) installed simultaneously
- **TournamentToolbar component**: 619-line file with embedded CSS-in-JS styles and complex configuration objects
- **Package.json**: 74 production dependencies, many potentially consolidatable
- **Button component**: 537 lines with multiple specialized variants (TournamentButton, CalendarButton, etc.)

**Why it matters:**
- **Performance**: Larger bundle = slower initial load, especially on mobile networks
- **DX**: Bundle limits enforced by `enforce-limits.js` script create development friction
- **UX**: Users on slower connections experience degraded performance

**Impact ranking:** High leverage - Small changes (dependency consolidation) yield significant bundle reduction

---

## Problem 2: Inconsistent Styling Architecture

**Description:** Components use three different styling approaches without clear guidelines, creating maintenance overhead and visual inconsistency.

**Evidence:**
- **TournamentToolbar**: CSS modules + inline configuration objects + Tailwind classes
- **Button component**: Pure Tailwind with `class-variance-authority` + complex variant system
- **Shared components**: Mix of dedicated CSS files and Tailwind utilities
- **Design tokens**: Partially migrated (evident from `.dev/specs/ui-ux-consolidation/`)

**Why it matters:**
- **Maintainability**: Developers must context-switch between styling paradigms
- **Consistency**: Similar components styled differently create visual friction
- **Velocity**: Decision paralysis when adding new components

**Impact ranking:** High leverage - Standardizing on one approach reduces cognitive load and speeds development

---

## Problem 3: Navigation System Complexity

**Description:** Navigation logic is scattered across multiple files with overlapping responsibilities and type duplication.

**Evidence:**
- **Navigation consolidation spec**: Identifies "Type Duplication", "Scattered Logic", "Import Complexity"
- **Multiple navigation files**: `navigation.config.ts`, `navbarCore.tsx`, `NavbarConfig.ts`
- **TournamentToolbar**: Embedded navigation configuration alongside component logic
- **Context complexity**: Navbar context with 12+ properties managing disparate concerns

**Why it matters:**
- **DX**: Developers import from multiple files for related functionality
- **Type safety**: Duplicated types risk becoming inconsistent
- **Testing**: Scattered logic makes comprehensive testing difficult

**Impact ranking:** Medium leverage - Consolidation improves but doesn't directly impact user experience

---

## Problem 4: Component Organization Inconsistency

**Description:** Shared components follow different organizational patterns, making the codebase harder to navigate and extend.

**Evidence:**
- **Inconsistent directory structure**:
  - `Button/` (directory with single .tsx file)
  - `Card/` (directory with .tsx + .css)
  - `TournamentToolbar/` (directory with .tsx + .css)
  - `CommonUI.tsx` (single file in components root)
- **Mixed file patterns**: Some components have dedicated directories, others are single files
- **CSS organization**: Some CSS modules co-located, others in separate `styles/` directories

**Why it matters:**
- **Discoverability**: Developers waste time finding component implementations
- **Consistency**: New components follow arbitrary patterns
- **Refactoring**: Moving between patterns creates unnecessary churn

**Impact ranking:** Medium leverage - Standardization improves DX without changing functionality

---

## Problem 5: Design Token Migration Incomplete

**Description:** Design tokens exist but aren't consistently used, leaving hardcoded values scattered throughout the codebase.

**Evidence:**
- **UI/UX consolidation spec**: Explicitly calls out "hardcoded z-index values", "hardcoded pixel widths", "hardcoded spacing"
- **Button component**: Complex CSS custom properties mixed with Tailwind
- **Partial migration**: Some components use tokens, others use raw values
- **Documentation gap**: No clear guidance on when to use tokens vs utilities

**Why it matters:**
- **Maintainability**: Theme changes require updating multiple hardcoded values
- **Consistency**: Similar spacing/color values implemented differently
- **Scalability**: Adding new themes becomes exponentially harder

**Impact ranking:** High leverage - Token completion enables systematic theming and consistency

---

## Problem 6: Accessibility Debt Accumulation

**Description:** Accessibility features are implemented inconsistently, with focus states and touch targets not systematically verified.

**Evidence:**
- **UI/UX consolidation spec**: Calls for "accessibility audit completion"
- **Button component**: Includes `aria-label` props but no systematic focus ring verification
- **TournamentToolbar**: Complex interactive element without documented accessibility patterns
- **Touch targets**: No evidence of 48px minimum verification across components

**Why it matters:**
- **Legal compliance**: WCAG requirements not systematically met
- **User experience**: Keyboard/screen reader users face barriers
- **Inclusive design**: Accessibility debt compounds over time

**Impact ranking:** Medium leverage - Important for compliance but may not affect primary user journeys

---

## Problem 7: Code Organization Cognitive Load

**Description:** Feature boundaries blur between shared utilities, business logic, and presentation concerns.

**Evidence:**
- **TournamentToolbar**: Contains business logic, styling, configuration, and UI in single file
- **Button component**: Exports multiple specialized variants from single file
- **Shared hooks**: Mix of UI hooks (`useMasonryLayout`) and business logic hooks (`tournamentHooks`)
- **Service layer**: Business logic mixed with data fetching in `supabase` services

**Why it matters:**
- **Maintainability**: Changes in one area risk affecting unrelated functionality
- **Testing**: Tight coupling makes isolated testing difficult
- **Reusability**: Components with embedded business logic can't be easily reused

**Impact ranking:** Low leverage - Architectural improvements but significant refactoring effort

---

## Leverage Ranking Summary

**High Leverage (Small changes → Big impact):**
1. Bundle size optimization (dependency consolidation)
2. Styling architecture standardization
3. Design token migration completion

**Medium Leverage (Moderate effort → Moderate impact):**
4. Navigation system consolidation
5. Component organization standardization
6. Accessibility audit completion

**Low Leverage (Large effort → Incremental impact):**
7. Code organization refactoring

## Success Criteria Alignment

This analysis prioritizes changes that:
- **Reduce bundle size** toward the 368KB target
- **Improve development velocity** through consistency
- **Enable future improvements** by completing foundational migrations
- **Maintain production stability** by avoiding risky architectural changes

The high-leverage problems represent the "low-hanging fruit" that can significantly improve the system's entropy and maintainability without requiring extensive rewrites.