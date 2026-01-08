# 03-proposed-changes.md

## Proposed Changes (Conceptual Level)

This document describes the conceptual changes to be implemented, focusing on component-level modifications, styling approaches, and file reorganizations. All changes maintain existing functionality while reducing system entropy.

## Component-Level Changes

### TournamentToolbar Decomposition

**Current State:** Single 619-line component handling layout, glass effects, filtering logic, and configuration objects.

**Proposed Changes:**
- **Split into three components**: Layout container, filter controls, and tournament actions
- **Extract configuration**: Move glass effect configs and toolbar settings to separate configuration module
- **Separate concerns**: Business logic (filtering) separated from presentation (glass effects)
- **Standardize props**: Consistent prop patterns across all toolbar components

**Impact:** Reduces single component complexity from 619 lines to three focused components under 200 lines each.

---

### Button Component Consolidation

**Current State:** Single 537-line file exporting Button, IconButton, TournamentButton, CalendarButton, and ScrollToTopButton.

**Proposed Changes:**
- **Extract specialized buttons**: TournamentButton and CalendarButton move to feature-specific directories
- **Core Button component**: Retain Button and IconButton as shared primitives
- **Standardize variants**: Unified variant system across all button types
- **Simplify API**: Consistent prop interface for all button components

**Impact:** Core Button component reduced to ~200 lines, specialized buttons co-located with their features.

---

### Navigation System Unification

**Current State:** Navigation logic scattered across navbarCore.tsx, navigation.config.ts, and NavbarConfig.ts with duplicated types.

**Proposed Changes:**
- **Single type system**: All navigation types consolidated in shared/navigation/types.ts
- **Configuration centralization**: Navigation structure defined in shared/navigation/config.ts
- **Pure transformation**: Route matching and item building moved to shared/navigation/transform.ts
- **Context consolidation**: Navigation state management unified in shared/navigation/context.tsx

**Impact:** Eliminates type duplication, provides single import path for navigation functionality.

---

### Component Organization Standardization

**Current State:** Inconsistent directory structures - some components in directories, others as single files.

**Proposed Changes:**
- **Uniform directory structure**: Every component gets its own directory with ComponentName.tsx
- **Co-located styles**: CSS modules placed alongside component files when needed
- **Barrel exports**: Each component directory exports its public API through index.ts
- **Consistent naming**: Component files match directory names exactly

**Before/After Example:**
```
shared/components/
├── Button.tsx              →  shared/components/Button/Button.tsx + index.ts
├── Card.tsx + Card.css     →  shared/components/Card/Card.tsx + Card.module.css + index.ts
├── CommonUI.tsx            →  shared/components/CommonUI/CommonUI.tsx + index.ts
```

**Impact:** Predictable file locations, consistent import patterns, improved discoverability.

---

## Styling and Token Changes

### CSS Modules to Tailwind Migration

**Current State:** Components using CSS modules with custom properties mixed alongside Tailwind classes.

**Proposed Changes:**
- **Primary styling system**: All new components use Tailwind exclusively
- **Token integration**: Design tokens accessed through Tailwind custom properties
- **Gradual migration**: Existing CSS modules converted component-by-component
- **Style elimination**: Remove unused CSS classes during migration

**Migration Pattern:**
- Extract design token values from CSS modules
- Replace CSS classes with equivalent Tailwind utilities
- Remove CSS module files when no longer needed
- Update component imports to remove CSS module dependencies

**Impact:** Single styling approach reduces cognitive overhead and maintenance burden.

---

### Design Token Completion

**Current State:** Partial token usage with hardcoded values scattered throughout components.

**Proposed Changes:**
- **Comprehensive audit**: Catalog all hardcoded spacing, colors, and sizing values
- **Systematic replacement**: Convert hardcoded values to token references
- **Token expansion**: Add missing tokens for uncovered use cases
- **Validation rules**: CSS linting prevents new hardcoded values

**Token Migration Priority:**
1. **Spacing values**: Replace `margin: 1rem` with `var(--space-md)`
2. **Color values**: Replace `#hex` with `var(--color-primary)`
3. **Sizing values**: Replace `width: 300px` with `var(--card-width)`
4. **Z-index values**: Replace `z-index: 10` with `var(--z-sticky)`

**Impact:** Complete design system enables consistent theming and future customization.

---

### Glass Surface Standardization

**Current State:** Glass effects implemented with inconsistent backdrop blur and transparency values.

**Proposed Changes:**
- **Preset system**: Define light, medium, and strong glass variants in tokens
- **Consistent properties**: Standardized background, border, blur, and shadow values
- **Theme compatibility**: Glass tokens work in both light and dark themes
- **Usage documentation**: Clear guidelines for when to use each glass preset

**Glass Token Structure:**
```
--glass-light-bg: rgba(255, 255, 255, 0.1);
--glass-light-border: rgba(255, 255, 255, 0.2);
--glass-light-blur: 12px;

--glass-medium-bg: rgba(255, 255, 255, 0.15);
--glass-medium-border: rgba(255, 255, 255, 0.25);
--glass-medium-blur: 16px;

--glass-strong-bg: rgba(255, 255, 255, 0.2);
--glass-strong-border: rgba(255, 255, 255, 0.3);
--glass-strong-blur: 20px;
```

**Impact:** Consistent glassmorphism effects across all components.

---

## File and Folder Reorganizations

### Shared Component Restructuring

**Current State:** Flat component directory with mixed organization patterns.

**Proposed Changes:**
- **Directory per component**: Every component gets dedicated subdirectory
- **Co-located assets**: Styles, tests, and documentation alongside components
- **Barrel exports**: index.ts files provide clean public APIs
- **Feature boundaries**: Components grouped by functional domain

**New Structure:**
```
shared/components/
├── Button/
│   ├── Button.tsx
│   ├── index.ts
│   └── Button.test.tsx
├── Card/
│   ├── Card.tsx
│   ├── Card.module.css
│   └── index.ts
├── Form/
│   ├── Select.tsx
│   ├── Input.tsx
│   └── index.ts
```

**Impact:** Improved component discoverability and consistent maintenance patterns.

---

### Navigation Module Consolidation

**Current State:** Navigation functionality scattered across multiple files and directories.

**Proposed Changes:**
- **Single navigation module**: All navigation concerns in shared/navigation/
- **Clear module boundaries**: Types, config, transform, context, and hooks separated
- **Barrel exports**: Single import path for all navigation functionality
- **Documentation**: Module README explaining architecture and usage

**New Navigation Structure:**
```
shared/navigation/
├── types.ts           # All navigation type definitions
├── config.ts          # Navigation structure configuration
├── transform.ts       # Pure transformation functions
├── context.tsx        # React context and provider
├── hooks.ts           # Navigation-related hooks
├── index.ts           # Public API exports
└── README.md          # Module documentation
```

**Impact:** Eliminates import confusion, provides single source of truth for navigation.

---

### Feature-Specific Component Migration

**Current State:** Tournament-specific components mixed with shared components.

**Proposed Changes:**
- **Feature relocation**: TournamentButton moves to features/tournament/components/
- **Shared extraction**: Generic button functionality remains in shared/
- **Clear ownership**: Components owned by features that use them
- **Import updates**: Update import statements to reflect new locations

**Migration Example:**
- `shared/components/Button/TournamentButton.tsx` → `features/tournament/components/TournamentButton/`
- `shared/components/Button/CalendarButton.tsx` → `features/analytics/components/CalendarButton/`

**Impact:** Clear component ownership, reduced coupling between features.

---

## Bundle Optimization Changes

### Dependency Consolidation

**Current State:** Two icon libraries (Lucide React + Heroicons) increasing bundle size.

**Proposed Changes:**
- **Primary icon system**: Standardize on Lucide React for all new icons
- **Migration path**: Replace Heroicons usage with equivalent Lucide icons
- **Removal preparation**: Deprecate Heroicons imports before removal
- **Bundle verification**: Confirm bundle size reduction after consolidation

**Migration Strategy:**
1. **Audit usage**: Identify all Heroicons imports and usage locations
2. **Find equivalents**: Map Heroicons to Lucide React equivalents
3. **Replace imports**: Update import statements component by component
4. **Remove dependency**: Remove @heroicons/react from package.json

**Impact:** Expected 15KB bundle reduction while maintaining visual consistency.

---

### Component Splitting for Code Splitting

**Current State:** Large components loaded entirely, impacting initial bundle size.

**Proposed Changes:**
- **Lazy loading**: Split large feature components into lazy-loaded chunks
- **Route-based splitting**: Components loaded on route navigation
- **Shared component preservation**: Frequently used components remain in main bundle
- **Loading states**: Proper loading UI during component loading

**Splitting Candidates:**
- Tournament analysis components (loaded on /analysis route)
- Gallery grid component (loaded on /gallery route)
- Analytics dashboard (loaded on /analytics route)

**Impact:** Faster initial page load, improved perceived performance.

---

## Accessibility Improvements

### Focus State Standardization

**Current State:** Inconsistent focus ring implementation across interactive elements.

**Proposed Changes:**
- **Token-based focus**: Use --focus-ring token for all focus states
- **Consistent visibility**: All interactive elements show focus rings on keyboard navigation
- **Theme compatibility**: Focus rings work in both light and dark themes
- **Touch target verification**: Ensure 48px minimum touch targets on mobile

**Focus Implementation:**
- CSS custom property: `--focus-ring: 0 0 0 2px var(--color-focus)`
- Applied via :focus-visible pseudo-class
- Consistent across all interactive elements

**Impact:** Improved keyboard navigation and screen reader accessibility.

---

### ARIA Label Standardization

**Current State:** Inconsistent ARIA labeling for complex interactive elements.

**Proposed Changes:**
- **Required labels**: All icon buttons require aria-label props
- **Semantic markup**: Proper heading hierarchy and landmark roles
- **Screen reader testing**: Verify announcements are clear and helpful
- **Error state communication**: Proper error announcements for form validation

**Impact:** Enhanced assistive technology support and compliance.

---

## Design System Documentation Updates

### Unified UI/UX Documentation

**Current State:** UI/UX guidance scattered across multiple files and directories.

**Proposed Changes:**
- **Single reference**: Consolidate docs/UI_UX.md as primary design reference
- **Clear sections**: Tokens, components, theming, accessibility in one document
- **Usage examples**: Practical examples for each design pattern
- **Migration guides**: Clear paths for adopting new patterns

**Documentation Structure:**
- Design tokens and usage
- Component patterns and APIs
- Theming and responsive design
- Accessibility guidelines
- Migration checklists

**Impact:** Single source of truth reduces developer confusion and ensures consistency.

These conceptual changes provide a clear roadmap for implementation while maintaining system stability and improving long-term maintainability.