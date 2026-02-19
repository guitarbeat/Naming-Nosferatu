# Bolt's Journal

## 2024-05-23 - Optimized Masonry Layout Ref Iteration
**Learning:** Storing refs in a `useRef<Array>` for a dynamic list results in the array growing indefinitely or containing stale nulls if not managed. Iterating this entire array for layout calculations is O(total_history), not O(visible).
**Action:** When using refs for layout, loop only up to `visibleItemCount` or explicitly maintain the ref array to match the render list.

## 2024-05-24 - Memoization of Pure Functions
**Learning:** Pure functions returning new array references (like `.filter()`) should be memoized in React components if passed as props or dependencies to hooks, even if the computation is cheap, to prevent cascading re-renders and effect triggers.
**Action:** Always check function returns used in dependency arrays.

## 2024-05-24 - Debouncing LocalStorage Writes
**Learning:** Frequent synchronous writes to `localStorage` can block the main thread, especially with large JSON objects (e.g., match history).
**Action:** Implemented a `debounce` utility and updated `useLocalStorage` to support an optional `debounceDelay`. This allows React state to update immediately for UI responsiveness while deferring the expensive storage write.
