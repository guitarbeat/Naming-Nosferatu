## 2025-02-21 - Missing Testing Environment for DOM Hooks
**Learning:** The project uses `vitest` but lacks `jsdom` or `happy-dom` in `devDependencies`. This prevents testing React hooks (like `useMasonryLayout`) that interact with the DOM using `react-dom` or `@testing-library/react` (which is also missing).
**Action:** When working on DOM-related hooks, rely on manual verification or logic inspection unless `jsdom` is added to the project. Do not attempt to add `// @vitest-environment jsdom` without verifying installation.
