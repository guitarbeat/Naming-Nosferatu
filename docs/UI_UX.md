# UI/UX Design System

**Last Updated:** 2026-01-07
**Status:** Primary Reference for Visual Design & Usability

---

## Table of Contents

1. [Design Tokens](#1-design-tokens)
   - [Spacing System](#spacing-system)
   - [Typography System](#typography-system)
   - [Color System](#color-system)
   - [Border Radius](#border-radius)
   - [Z-Index System](#z-index-system)
   - [Transitions](#transitions)
   - [Shadows](#shadows)
   - [Breakpoints](#breakpoints)
2. [Glass Surfaces](#2-glass-surfaces)
   - [Glass Presets](#glass-presets)
   - [Theme-Aware Glass Tokens](#theme-aware-glass-tokens)
3. [Component Tokens](#3-component-tokens)
   - [Button Tokens](#button-tokens)
   - [Card Tokens](#card-tokens)
   - [Input Tokens](#input-tokens)
   - [Grid/Mosaic Tokens](#gridmosaic-tokens)
4. [Theming](#4-theming)
   - [Light Theme](#light-theme)
   - [Dark Theme](#dark-theme)
   - [High Contrast Mode](#high-contrast-mode)
5. [Accessibility](#5-accessibility)
   - [Focus States](#focus-states)
   - [Touch Targets](#touch-targets)
   - [Reduced Motion](#reduced-motion)
   - [Color Contrast](#color-contrast)
6. [Liquid Glass Component](#6-liquid-glass-component)
7. [Usability & Onboarding](#7-usability--onboarding)
8. [Best Practices](#8-best-practices)
9. [Migration Checklist](#9-migration-checklist)
10. [CSS Composition Guide](#10-css-composition-guide)

---

## 1. Design Tokens

All design tokens are defined in `src/shared/styles/design-tokens.css`. Use these tokens instead of hardcoded values for consistency and maintainability.

### Spacing System

Base unit: 4px. Use semantic spacing tokens for consistent rhythm.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `--space-0` | 0 | 0px | No spacing |
| `--space-1` | 0.25rem | 4px | Tight spacing |
| `--space-2` | 0.5rem | 8px | Small gaps |
| `--space-3` | 0.75rem | 12px | Component padding |
| `--space-4` | 1rem | 16px | Standard spacing |
| `--space-5` | 1.25rem | 20px | Medium spacing |
| `--space-6` | 1.5rem | 24px | Section gaps |
| `--space-8` | 2rem | 32px | Large spacing |
| `--space-10` | 2.5rem | 40px | Extra large |
| `--space-12` | 3rem | 48px | Section padding |
| `--space-16` | 4rem | 64px | Page sections |
| `--space-20` | 5rem | 80px | Hero spacing |
| `--space-24` | 6rem | 96px | Major sections |

**Semantic Spacing Tokens:**

```css
--spacing-component-padding: var(--space-4);  /* 16px */
--spacing-component-gap: var(--space-3);      /* 12px */
--spacing-section-gap: var(--space-6);        /* 24px */
--spacing-page-padding: var(--space-4);       /* 16px */
--spacing-card-padding: var(--space-4);       /* 16px */
--spacing-card-gap: var(--space-4);           /* 16px */
```

**Usage Example:**
```css
.card {
  padding: var(--space-4);
  margin-bottom: var(--space-6);
  gap: var(--spacing-component-gap);
}
```

### Typography System

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Inter, system-ui | Body text |
| `--font-serif` | Playfair Display | Headings |
| `--font-mono` | JetBrains Mono | Code |

**Font Sizes:**

| Token | Value | Pixels |
|-------|-------|--------|
| `--text-xs` | 0.75rem | 12px |
| `--text-sm` | 0.875rem | 14px |
| `--text-base` | 1rem | 16px |
| `--text-lg` | 1.125rem | 18px |
| `--text-xl` | 1.25rem | 20px |
| `--text-2xl` | 1.5rem | 24px |
| `--text-3xl` | 1.875rem | 30px |
| `--text-4xl` | 2.25rem | 36px |
| `--text-5xl` | 3rem | 48px |

**Responsive Text (use for fluid typography):**

```css
--text-responsive-xs: clamp(0.75rem, 1.5vw, 0.875rem);
--text-responsive-sm: clamp(0.875rem, 1.75vw, 1rem);
--text-responsive-base: clamp(1rem, 2vw, 1.125rem);
--text-responsive-lg: clamp(1.125rem, 2.25vw, 1.25rem);
--text-responsive-xl: clamp(1.25rem, 2.5vw, 1.5rem);
--text-responsive-2xl: clamp(1.5rem, 3vw, 2rem);
```

**Font Weights:**

| Token | Value |
|-------|-------|
| `--font-weight-normal` | 400 |
| `--font-weight-medium` | 500 |
| `--font-weight-semibold` | 600 |
| `--font-weight-bold` | 700 |

**Line Heights:**

| Token | Value |
|-------|-------|
| `--leading-tight` | 1.25 |
| `--leading-normal` | 1.5 |
| `--leading-relaxed` | 1.75 |

### Color System

**Brand Colors** (use sparingly for emphasis):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-neon-cyan` | #2ff3e0 | Primary accent |
| `--color-hot-pink` | #fa26a0 | Secondary accent |
| `--color-fire-red` | #f51720 | Danger/emphasis |

**Semantic Colors:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | #10b981 | Success states |
| `--color-error` | #ef4444 | Error states |
| `--color-warning` | #f59e0b | Warning states |
| `--color-info` | #3b82f6 | Info states |

**Neutral Scale:**

| Token | Value |
|-------|-------|
| `--color-neutral-50` | #f8fafc |
| `--color-neutral-100` | #f1f5f9 |
| `--color-neutral-200` | #e2e8f0 |
| `--color-neutral-300` | #cbd5e1 |
| `--color-neutral-400` | #94a3b8 |
| `--color-neutral-500` | #64748b |
| `--color-neutral-600` | #475569 |
| `--color-neutral-700` | #334155 |
| `--color-neutral-800` | #1e293b |
| `--color-neutral-900` | #0f172a |

**Gradients:**

```css
--gradient-primary: linear-gradient(135deg, var(--neon-cyan), var(--hot-pink));
--gradient-vibrant: linear-gradient(135deg, var(--fire-red), var(--hot-pink), var(--neon-cyan));
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | Sharp corners |
| `--radius-xs` | 0.125rem (2px) | Mosaic edges |
| `--radius-sm` | 0.375rem (6px) | Small elements |
| `--radius-md` | 0.5rem (8px) | Buttons, inputs |
| `--radius-lg` | 0.75rem (12px) | Cards |
| `--radius-xl` | 1rem (16px) | Large cards |
| `--radius-2xl` | 1.5rem (24px) | Modals |
| `--radius-full` | 9999px | Pills, avatars |

**Component-Specific:**

```css
--radius-button: var(--radius-md);
--radius-card: var(--radius-lg);
--radius-card-mosaic: var(--radius-xs);  /* Sharp for mosaic */
--radius-input: var(--radius-md);
--radius-badge: var(--radius-full);
```

### Z-Index System

Use semantic z-index tokens instead of hardcoded numbers.

| Token | Value | Usage |
|-------|-------|-------|
| `--z-negative` | -1 | Behind content |
| `--z-0` | 0 | Base level |
| `--z-10` | 10 | Slightly elevated |
| `--z-20` | 20 | Cards |
| `--z-30` | 30 | Dropdowns |
| `--z-40` | 40 | Fixed elements |
| `--z-50` | 50 | Overlays |
| `--z-elevate` | 1 | Minor elevation |
| `--z-sticky` | 1000 | Sticky headers |
| `--z-drawer` | 200 | Side drawers |
| `--z-modal` | 300 | Modals |
| `--z-popover` | 400 | Popovers |
| `--z-toast` | 500 | Toast notifications |
| `--z-modal-backdrop` | 1050 | Modal backdrops |
| `--z-max` | 10000 | Skip links |

**Usage Example:**
```css
/* ❌ Avoid */
.modal { z-index: 100; }

/* ✅ Prefer */
.modal { z-index: var(--z-modal); }
```

### Transitions

**Timing Functions:**

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-standard` | cubic-bezier(0.4, 0, 0.2, 1) | General use |
| `--ease-enter` | cubic-bezier(0, 0, 0.2, 1) | Enter animations |
| `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Exit animations |
| `--ease-emphasized` | cubic-bezier(0.2, 0, 0, 1) | Emphasis |

**Durations:**

| Token | Value |
|-------|-------|
| `--duration-instant` | 100ms |
| `--duration-fast` | 150ms |
| `--duration-normal` | 250ms |
| `--duration-slow` | 350ms |
| `--duration-slower` | 500ms |

**Pre-built Transitions:**

```css
--transition-base: all var(--duration-normal) var(--ease-standard);
--transition-color: color var(--duration-fast) var(--ease-standard);
--transition-transform: transform var(--duration-normal) var(--ease-standard);
--transition-opacity: opacity var(--duration-fast) var(--ease-standard);
--transition-theme: 0.3s ease;  /* For theme changes */
```

### Shadows

**Elevation Shadows:**

| Token | Usage |
|-------|-------|
| `--shadow-xs` | Subtle elevation |
| `--shadow-sm` | Cards |
| `--shadow-md` | Dropdowns |
| `--shadow-lg` | Modals |
| `--shadow-xl` | Popovers |

**Colored Shadows** (use sparingly):

```css
--shadow-cyan: 0 4px 16px var(--overlay-cyan-medium);
--shadow-pink: 0 4px 16px var(--overlay-pink-medium);
--shadow-gradient: 0 8px 24px var(--overlay-cyan), 0 4px 12px var(--overlay-pink);
```

### Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `--breakpoint-sm` | 640px | Mobile landscape |
| `--breakpoint-md` | 768px | Tablet |
| `--breakpoint-lg` | 1024px | Desktop |
| `--breakpoint-xl` | 1280px | Large desktop |
| `--breakpoint-2xl` | 1536px | Extra large |

**Usage Example:**
```css
/* ❌ Avoid */
@media (min-width: 768px) { ... }

/* ✅ Prefer */
@media (min-width: var(--breakpoint-md)) { ... }
```

---

## 2. Glass Surfaces

Glassmorphism effects using backdrop blur, semi-transparent backgrounds, and subtle borders.

### Glass Presets

Three standard glass presets for consistent glassmorphism:

**Glass Light** - Subtle background effect:
```css
.glass-light {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}
```

**Glass Medium** - Standard glassmorphism:
```css
.glass-medium {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
}
```

**Glass Strong** - Prominent glass effect:
```css
.glass-strong {
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur-strong));
  border: 1px solid var(--glass-border-hover);
  box-shadow: var(--glass-shadow-colored);
}
```

### Theme-Aware Glass Tokens

Glass tokens are defined in both light and dark themes in `themes.css`:

| Token | Light Theme | Dark Theme |
|-------|-------------|------------|
| `--glass-bg` | rgb(241 245 249 / 60%) | rgb(15 23 42 / 55%) |
| `--glass-bg-light` | rgb(241 245 249 / 40%) | rgb(15 23 42 / 30%) |
| `--glass-bg-strong` | rgb(241 245 249 / 65%) | rgb(15 23 42 / 70%) |
| `--glass-border` | rgb(15 23 42 / 7%) | rgb(255 255 255 / 12%) |
| `--glass-border-hover` | rgb(15 23 42 / 12%) | rgb(255 255 255 / 22%) |
| `--glass-blur` | 18px | 22px |
| `--glass-blur-strong` | 26px | 32px |

**Usage with Fallbacks:**
```css
/* Include fallback for older browsers */
background: var(--glass-bg, rgba(15, 23, 42, 0.55));
```

---

## 3. Component Tokens

### Button Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--button-base-height` | 48px | Standard button |
| `--button-height-sm` | 32px | Small button |
| `--button-height-md` | 40px | Medium button |
| `--button-height-lg` | 48px | Large button |
| `--button-border-radius` | var(--radius-button) | Rounded corners |
| `--button-font-weight` | 600 | Semi-bold text |
| `--button-disabled-opacity` | 0.7 | Disabled state |

**Button Transforms:**
```css
--button-hover-transform: translateY(-2px) scale(1.02);
--button-active-transform: translateY(-1px) scale(1.01);
```

### Card Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--card-padding-sm` | var(--space-3) | Small cards |
| `--card-padding-md` | var(--space-4) | Standard cards |
| `--card-padding-lg` | var(--space-6) | Large cards |
| `--card-border-radius` | var(--radius-card) | Standard radius |
| `--card-border-radius-mosaic` | var(--radius-xs) | Mosaic layout |
| `--card-gap` | var(--space-1) | Mosaic gaps |
| `--card-gap-normal` | var(--space-4) | Standard gaps |

**Responsive Card Widths:**
```css
--card-width-xs: 140px;    /* Mobile */
--card-width-sm: 160px;    /* Tablet */
--card-width-md: 180px;    /* Desktop */
--card-width-lg: 190px;    /* Large desktop */
--card-width-xl: 200px;    /* Extra large */
--card-width-responsive: clamp(140px, 12vw, 200px);
```

### Input Tokens

| Token | Value |
|-------|-------|
| `--input-height-sm` | 36px |
| `--input-height-md` | 40px |
| `--input-height-lg` | 48px |
| `--input-padding-x` | var(--space-3) |
| `--input-padding-y` | var(--space-2) |
| `--input-border-radius` | var(--radius-input) |

### Grid/Mosaic Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--grid-gap-mosaic` | var(--card-gap) | Tight mosaic |
| `--grid-gap-normal` | var(--card-gap-normal) | Standard grid |
| `--grid-row-unit` | 20px | Flexible sizing |
| `--grid-min-column-width` | 200px | Responsive grids |

---

## 4. Theming

The theme system uses CSS custom properties with `data-theme` attributes.

### Light Theme

Set with `data-theme="light"` on the root element.

**Key Variables:**
```css
--surface-color: #f1f5f9;
--background-color: #e2e8f0;
--text-primary: #334155;
--text-secondary: #64748b;
--border-color: #cbd5e1;
--card-background: #f1f5f9;
```

### Dark Theme

Set with `data-theme="dark"` on the root element.

**Key Variables:**
```css
--surface-color: #0b1120;
--background-color: #020617;
--text-primary: #f8fafc;
--text-secondary: #e2e8f0;
--border-color: #334155;
--card-background: #0b1220;
```

### High Contrast Mode

Automatically activated via `@media (prefers-contrast: more)`.

**Enhanced Features:**
- 4px solid focus outlines
- Maximum contrast colors
- Enhanced button borders

---

## 5. Accessibility

### Focus States

All interactive elements must have visible focus states using the `--focus-ring` token:

```css
:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

**Focus Ring Token:**
```css
--focus-ring:
  0 0 0 var(--focus-ring-width) var(--focus-ring-color),
  0 0 0 calc(var(--focus-ring-width) + var(--focus-ring-offset))
    color-mix(in srgb, var(--focus-ring-color) 20%, transparent);
```

### Touch Targets

All interactive elements must have a minimum touch target of 48×48px:

```css
.interactive {
  min-height: 48px;
  min-width: 48px;
}
```

### Reduced Motion

Respect user preferences for reduced motion:

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

### Color Contrast

- All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Dark theme text colors are optimized for contrast:
  - `--text-secondary: #e2e8f0` (8.5:1 on dark background)
  - `--text-tertiary: #e2e8f0` (8.5:1 on dark background)

---

## 6. Liquid Glass Component

A specialized React component (`src/shared/components/LiquidGlass`) that creates fluid refraction effects via SVG displacement maps.

**Key Presets:**

| Preset | Dimensions | Usage |
|--------|------------|-------|
| `dock` | 336×96px | Horizontal wide effect |
| `pill` | 200×80px | Rounded edges |
| `bubble` | 140×140px | Circular |

**Usage:**
```tsx
import { LiquidGlass } from '@/shared/components/LiquidGlass';

<LiquidGlass preset="pill">
  <YourContent />
</LiquidGlass>
```

---

## 7. Usability & Onboarding

### User Journey Onboarding

We focus on "Progressive Disclosure"—only showing complexity when the user is ready.

- **First-Match Tutorial**: Small overlay explaining "Click to vote, ↑ for both, ↓ to skip."
- **Progress Counter**: Clear "{x} of {n} names selected" messaging during setup.
- **Milestone Celebrations**: Visual cues at 50% and 80% tournament completion.

### Copy Guidelines

- **Avoid cold/technical language**: "Operator Identity" → "Your Name"
- **Use warm greetings**: "Welcome! Let's find the perfect name for your cat 🐱"
- Add friendly prefixes to facts: "Did you know?" or "Fun Fact:"
- Use time-of-day greetings: "Good Evening, Judge!"

---

## 8. Best Practices

### CSS Modules
Always co-locate `.module.css` files with their components:
```
Button/
├── Button.tsx
└── Button.module.css
```

### Avoid Inline Styles
Use CSS custom properties for dynamic values:
```tsx
// ❌ Avoid
<div style={{ padding: '16px' }}>

// ✅ Prefer
<div style={{ padding: 'var(--space-4)' }}>
// Or better, use CSS modules
```

### Responsive Layouts
Use `clamp()` for values that should scale:
```css
font-size: clamp(1rem, 2vw, 1.5rem);
width: var(--card-width-responsive);
```

### Performance
Animate only `transform` and `opacity` to maintain 60fps:
```css
/* ✅ GPU-accelerated */
transform: translateY(-2px);
opacity: 0.8;

/* ❌ Causes repaints */
top: 10px;
width: 100px;
```

---

## 9. Migration Checklist

### ✅ Completed
- PerformanceBadge: Replaced hardcoded purple with `color-mix()` and tokens
- Error Component: Removed all hardcoded RGB values
- NameGrid: Switched to Masonry layout with glass surface tokens

### ⚠️ In Progress
- [ ] **Z-Index**: Replace hardcoded values with `--z-*` tokens
- [ ] **SetupCards.module.css**: Replace `180px` with `--card-width-responsive`
- [ ] **SetupSwipe.module.css**: Standardize color fallbacks
- [ ] **Spacing**: Replace hardcoded rem/px with `--space-*` tokens
- [ ] **Breakpoints**: Replace `768px` with `var(--breakpoint-md)`
- [ ] **useMasonryLayout**: Integrate design tokens

### Technical Recommendations
1. **Maintain Type Coverage**: Continue replacing `any` in legacy catch blocks
2. **Standardize Breakpoints**: Use `var(--breakpoint-md)` instead of hardcoded `768px`
3. **Print Styles**: Add print-specific CSS for tournament results and rankings

---

## 10. CSS Composition Guide

To maintain a DRY (Don't Repeat Yourself) styling architecture and leverage centralized primitives, the project uses **CSS Modules Composition**. This allows developers to inherit styles from global utility classes while keeping local component styles focused and manageable.

### Core Principles

1. **Composition First**: Use `composes: [CLASS] from global;` as the **first line** in your CSS module class definition
2. **Layering**: Global styles provide base behavior; local styles add specificity
3. **Design Tokens**: Always use CSS custom properties for dynamic values
4. **Theme Awareness**: Global classes automatically adapt to light/dark themes

### Syntax Reference

```css
/* Basic composition */
.myClass {
  composes: globalClass from global;
  /* Local styles */
}

/* Multiple compositions */
.myClass {
  composes: baseClass spacingClass from global;
  /* Local styles */
}

/* Conditional composition (advanced) */
.myClass {
  composes: baseClass from global;
}

.myClass--active {
  composes: activeState from global;
}
```

### 1. Glass Surfaces

Centralized glassmorphism styles ensure consistent blur, border, and background effects across the application. Glass classes automatically adapt to theme changes and provide appropriate fallbacks.

#### Basic Usage

```css
/* Modal.module.css */
.overlay {
  composes: glass-strong from global;
  position: fixed;
  inset: 0;
  z-index: var(--z-modal-backdrop);
}

/* Card.module.css */
.content {
  composes: glass-medium from global;
  composes: elevatedCard from global;
  padding: var(--card-padding-md);
}
```

#### Glass Variants

| Global Class | Theme Adaptation | Use Case |
|--------------|------------------|----------|
| `glass-light` | `rgba(241, 245, 249, 0.4)` / `rgba(15, 23, 42, 0.3)` | Subtle backgrounds, low-priority panels |
| `glass-medium` | `rgba(241, 245, 249, 0.6)` / `rgba(15, 23, 42, 0.55)` | Standard surfaces, cards, navigation |
| `glass-strong` | `rgba(241, 245, 249, 0.65)` / `rgba(15, 23, 42, 0.7)` | Modals, dropdowns, high-impact overlays |

#### Advanced Glass Composition

```css
/* InteractiveCard.module.css */
.card {
  composes: glass-medium from global;
  composes: elevatedCard from global;
  transition: var(--transition-base);
}

.card:hover {
  composes: glass-strong from global;
  /* Override specific properties while keeping glass behavior */
  backdrop-filter: blur(var(--glass-blur-strong));
}
```

### 2. Layout Primitives

Standardized layout patterns eliminate repetitive flexbox/grid boilerplate. These primitives handle common layout needs while remaining flexible for component-specific requirements.

#### Stack Layouts (Vertical)

```css
/* Form.module.css */
.form {
  composes: stack from global;
  composes: stack-md from global; /* 12px gap */
  max-width: 400px;
}

/* Section.module.css */
.section {
  composes: stack from global;
  composes: stack-lg from global; /* 16px gap */
  composes: heroStage from global; /* Responsive min-height */
}
```

#### Cluster Layouts (Horizontal)

```css
/* ButtonGroup.module.css */
.actions {
  composes: cluster from global;
  composes: cluster-sm from global; /* 8px gap */
  justify-content: flex-end;
}

/* Navigation.module.css */
.nav {
  composes: cluster from global;
  composes: cluster-md from global; /* 12px gap */
  flex-wrap: wrap;
}
```

#### Grid and Special Layouts

```css
/* NameGrid.module.css */
.grid {
  composes: grid-mosaic from global;
  /* Custom grid properties */
  --grid-min-column-width: var(--card-width-responsive);
}

/* CenteredContent.module.css */
.hero {
  composes: flex-center from global;
  composes: heroStage from global;
  min-height: 60vh;
}
```

#### Layout Primitive Reference

| Primitive | CSS Properties | Variants | Use Case |
|-----------|----------------|----------|----------|
| `stack` | `display: flex; flex-direction: column` | `-xs`, `-sm`, `-md`, `-lg`, `-xl` | Vertical content flow |
| `cluster` | `display: flex; flex-wrap: wrap` | `-xs`, `-sm`, `-md`, `-lg`, `-xl` | Horizontal wrapping |
| `heroStage` | `display: flex; align-items: center; min-height: clamp(50vh, 80vh, 600px)` | None | Landing sections |
| `flex-center` | `display: flex; align-items: center; justify-content: center` | None | Centered content |
| `grid-mosaic` | `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` | None | Masonry layouts |

### 3. Card Surfaces

Card primitives provide consistent borders, backgrounds, shadows, and interaction states. They compose with glass surfaces for layered visual effects.

#### Basic Card Composition

```css
/* StandardCard.module.css */
.card {
  composes: surfaceCard from global;
  composes: elevatedCard from global;
  /* Component-specific sizing */
  width: var(--card-width-responsive);
  padding: var(--card-padding-md);
}

/* MosaicCard.module.css */
.mosaicCard {
  composes: card-mosaic from global;
  /* Sharp edges for grid layouts */
  border-radius: var(--radius-xs);
}
```

#### Interactive Cards

```css
/* InteractiveCard.module.css */
.interactiveCard {
  composes: elevatedCard from global;
  composes: glass-medium from global;
  cursor: pointer;
  transition: var(--transition-base);
}

.interactiveCard:hover {
  transform: var(--button-hover-transform);
  box-shadow: var(--shadow-lg);
}

.interactiveCard:active {
  transform: var(--button-active-transform);
}
```

#### Card Primitive Reference

| Global Class | Composition | Key Properties | Use Case |
|--------------|-------------|----------------|----------|
| `surfaceCard` | Base layer | `border-radius: var(--radius-card); border: 1px solid var(--border-color)` | Basic card structure |
| `elevatedCard` | Extends `surfaceCard` | `box-shadow: var(--shadow-md); transition: var(--transition-transform)` | Cards with depth |
| `card-base` | Utility | `padding: var(--card-padding-md); transition: var(--transition-base)` | Quick card setup |
| `card-mosaic` | Grid-optimized | `border-radius: var(--radius-xs); margin: var(--card-gap)` | Grid/masonry layouts |

### Best Practices

#### 1. Composition Order Matters
```css
/* ✅ Correct: Global first, then local */
.myClass {
  composes: glass-medium from global;  /* Global behavior */
  composes: elevatedCard from global;  /* Additional global behavior */
  /* Local customizations */
  padding: var(--space-6);
  max-width: 600px;
}

/* ❌ Avoid: Local styles before global */
.myClass {
  padding: var(--space-6);              /* Local first */
  composes: glass-medium from global;   /* Global after - breaks cascade */
}
```

#### 2. Override Strategically
```css
/* ✅ Good: Override specific properties while preserving global behavior */
.customGlass {
  composes: glass-medium from global;
  /* Only override what you need to change */
  background: var(--glass-bg-strong);  /* Stronger opacity */
  /* Blur and border inherited from glass-medium */
}

/* ❌ Avoid: Redefining entire global classes */
.customGlass {
  /* Don't copy-paste global class definitions */
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(22px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

#### 3. Theme-Aware Composition
```css
/* Global classes automatically adapt to themes */
.themedCard {
  composes: glass-medium from global;    /* Adapts to light/dark */
  composes: elevatedCard from global;    /* Theme-aware shadows */
  /* Your component-specific styles */
}
```

#### 4. Performance Considerations
- **GPU Acceleration**: Global classes use `transform` and `opacity` for animations
- **Minimal Repaints**: Avoid animating properties that trigger layout recalculations
- **Bundle Size**: Composing global classes prevents CSS duplication

#### 5. Debugging Composition
```css
/* Add this temporarily to debug composition */
.debugClass {
  composes: glass-medium from global;
  /* Visual debugging */
  border: 2px solid red !important;
  background: rgba(255, 0, 0, 0.1) !important;
}
```

### Migration Examples

#### From Inline Styles
```tsx
// Before
<div style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(18px)' }}>

// After
<div className={styles.glassPanel}>
```

```css
/* Component.module.css */
.glassPanel {
  composes: glass-medium from global;
}
```

#### From Repeated CSS
```css
/* Before: Repeated in multiple files */
.card {
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 16px;
}

/* After: Compose global primitives */
.card {
  composes: glass-medium from global;
  composes: surfaceCard from global;
  padding: var(--card-padding-md);
}
```
