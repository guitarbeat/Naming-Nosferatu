---
description: UI/UX development and verification workflow for the Name Nosferatu app
---

# UI/UX Workflow

## Pre-Flight Checks
// turbo-all
```bash
npm run lint:types    # TypeScript errors are BLOCKING
npm run lint          # ESLint + Stylelint
```

## Development Loop

1. **Start dev server**: `npm run dev`
2. **Make UI changes** — focus on warm, welcoming copy and visual polish
3. **Lint after changes**: `npm run lint:fix && npm run lint`
4. **Verify build**: `npm run build`

## Usability Test (Manual)

Prerequisites: lint and build must pass.

1. Select two names
2. Start a tournament
3. Play through to completion
4. View the results page
5. Verify the reordering feature

## Copy Guidelines

- **Avoid cold/technical language**: "Operator Identity" → "Your Name"
- **Use warm greetings**: "Welcome! Let's find the perfect name for your cat 🐱"
- Add friendly prefixes to facts: "Did you know?" or "Fun Fact:"
- Use time-of-day greetings: "Good Evening, Judge!"

## Design Checklist

- [ ] Dark/light theme works
- [ ] 48px minimum touch targets (accessibility)
- [ ] Responsive breakpoints (480px, 768px, 1024px, 1400px)
- [ ] Smooth micro-animations
- [ ] WCAG AA compliant contrast
