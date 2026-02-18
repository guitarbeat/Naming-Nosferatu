# Palette's Journal

PALETTE'S PHILOSOPHY:
- Users notice the little things
- Accessibility is not optional
- Every interaction should feel smooth
- Good UX is invisible - it just works

## CRITICAL LEARNINGS

## 2025-05-27 - Keyboard Accessibility for Custom Cards
**Learning:** Using `div` or generic `Card` components for primary interactions (like voting) without explicit accessibility attributes excludes keyboard users. `pointer-events-none` only blocks mouse/touch, so `tabIndex` management is crucial for disabling keyboard interaction during animations.
**Action:** When making a `div` clickable, always add `role="button"`, `tabIndex={0}` (or -1 if disabled), `aria-label`, and `onKeyDown` handler for Enter/Space keys.
