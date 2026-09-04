## 📋 Description of Changes

<!-- Provide a clear, concise summary of the changes introduced in this PR. -->

---

## 🎯 Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking feature addition)
- [ ] ⚡ Performance optimization (rendering, memory, or bundle size)
- [ ] ♿ Accessibility improvement (a11y, ARIA live regions, keyboard navigation)
- [ ] 🔧 DevOps / CI/CD / Infrastructure improvement
- [ ] ♻️ Refactoring (no functional changes)

---

## ✅ Quality & Verification Checklist

Before requesting review, please confirm the following quality gates have been run locally:

- [ ] **Biome Lint & Formatting**: `pnpm run lint` passes with 0 errors and 0 warnings.
- [ ] **Biome Auto-Fix**: `pnpm run fix` applied to ensure consistent tabs, quotes, and sorted imports.
- [ ] **TypeScript Check**: `pnpm run lint:types` compiles cleanly with zero type errors (`tsc --noEmit`).
- [ ] **Knip Dependencies**: `pnpm run check:deps` confirms no orphan packages or unused exports.
- [ ] **Vitest Suite**: `pnpm test` passes 100% of unit and component test suites.
- [ ] **Production Build**: `pnpm run build` completes successfully with generated PWA assets.

---

## ♿ Accessibility & UX Verification

- [ ] Interactive elements are reachable and operable via keyboard alone (`Tab`, `Enter`, `Space`, `Escape`).
- [ ] Custom visualizers include proper ARIA roles and polite live regions for dynamic updates.
- [ ] Animations respect `prefers-reduced-motion` settings.
- [ ] Contrast meets WCAG AA standards in both Light and Dark modes.

---

## 📱 Offline & Storage Verification

- [ ] App operates seamlessly in offline mode (local storage fallback active).
- [ ] Sensitive state slices are properly serialized through the encrypted storage adapter.
