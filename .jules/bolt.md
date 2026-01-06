# Bolt's Journal

## 2024-05-22 - [Refactoring useTournament.ts]
**Learning:** The `useTournament` hook was tightly coupled with `PreferenceSorter`, accessing private properties via `any` casting. This made refactoring dangerous and brittle.
**Action:** When refactoring complex logic, first ensure proper encapsulation and interfaces. Avoid `any` casting to access private internals.

## 2024-05-22 - [DOM Updates in React]
**Learning:** High-frequency DOM updates (like magnetic pull effects) caused performance issues.
**Action:** Use `requestAnimationFrame` for visual updates and throttle event handlers. Store mutable values in `useRef` to avoid closure staleness without triggering re-renders.

## 2024-05-22 - [Testing JSDOM Limitations]
**Learning:** `getBoundingClientRect` returns zeros in JSDOM, breaking layout tests.
**Action:** Mock `getBoundingClientRect` or use a different testing strategy for layout-dependent logic.
