# UI & UX Guide

**Last Updated:** 2026-01-07
**Status:** Primary Reference for Visual Design & Usability

## 🎨 Visual Design System

### Design Tokens
We use a centralized token system in `src/shared/styles/design-tokens.css`.
- **Colors**: Use semantic tokens like `--color-primary`, `--surface-light`.
- **Spacing**: Use `--space-1` through `--space-24`.
- **Typography**: Use `--text-base`, `--text-lg`, etc.
- **Glassmorphism**: Use `--glass-bg`, `--glass-border`, and `--glass-blur`.

### Liquid Glass Component 🧪
A specialized React component (`src/shared/components/LiquidGlass`) that creates fluid refraction via SVG displacement maps.

**Key Presets:**
- `dock`: (336x96px) Horizontal wide effect.
- `pill`: (200x80px) Rounded edges.
- `bubble`: (140x140px) Circular.

---

## 🧭 Usability & Onboarding

### User Journey Onboarding
We focus on "Progressive Disclosure"—only showing complexity when the user is ready.
- **First-Match Tutorial**: Small overlay explaining "Click to vote, ↑ for both, ↓ to skip."
- **Progress Counter**: Clear "{x} of {n} names selected" messaging during setup.
- **Milestone Celebrations**: Visual cues at 50% and 80% tournament completion.

### Accessibility (A11y)
- **Focus Rings**: Standardized with `--focus-ring` tokens.
- **Touch Targets**: Minimum 48px height/width for all mobile interactive elements.
- **Reduced Motion**: Respects `prefers-reduced-motion` for all heavy animations.

---

## 🔍 Implementation Status

| Category | Completion | Remaining Work |
|----------|------------|----------------|
| **Z-Index Tokens** | 95% | Replace minor z-index (1, 2) in legacy cards. |
| **Color Tokens** | 98% | Standardize fallbacks in `SetupSwipe.module.css`. |
| **Focus States** | 90% | Audit interactive elements in analytics views. |
| **Mobile Gestures**| 10% | Implement Swipe-to-Vote on mobile devices. |

---

## 🔧 Best Practices
- **CSS Modules**: Always co-locate `.module.css` with the component.
- **Avoid Inline Styles**: Use CSS custom properties for dynamic values instead of direct inline styling where possible.
- **Responsive Layouts**: Use `clamp()` for values that should scale between mobile and desktop.
- **Performance**: Animate `transform` and `opacity` only to maintain 60fps.
