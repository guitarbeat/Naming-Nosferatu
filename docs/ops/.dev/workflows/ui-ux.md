---
description: UI/UX development and verification workflow for the Name Nosferatu app
---

# UI/UX Workflow

> **Design Reference:** For design tokens, component patterns, and accessibility guidelines, see [docs/UI_UX.md](../../docs/UI_UX.md).

## Pre-Flight Checks

```bash
npm run lint:types    # TypeScript errors are BLOCKING
npm run lint          # ESLint + Stylelint
```

## Development Loop

1. **Start dev server**: `npm run dev`
2. **Make UI changes** — reference `docs/UI_UX.md` for tokens and patterns
3. **Lint after changes**: `npm run lint:fix && npm run lint`
4. **Verify build**: `npm run build`

## Usability Test (Manual)

Prerequisites: lint and build must pass.

1. Select two names
2. Start a tournament
3. Play through to completion
4. View the results page
5. Verify the reordering feature

## Design Checklist

- [ ] Dark/light theme works
- [ ] 48px minimum touch targets (accessibility)
- [ ] Responsive breakpoints (use `--breakpoint-*` tokens)
- [ ] Smooth micro-animations (respect `prefers-reduced-motion`)
- [ ] WCAG AA compliant contrast
- [ ] Focus states visible (use `--focus-ring` token)
- [ ] Design tokens used (no hardcoded values)
