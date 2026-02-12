# Bolt's Journal

## 2024-05-23 - Optimized Masonry Layout Ref Iteration
**Learning:** Storing refs in a `useRef<Array>` for a dynamic list results in the array growing indefinitely or containing stale nulls if not managed. Iterating this entire array for layout calculations is O(total_history), not O(visible).
**Action:** When using refs for layout, loop only up to `visibleItemCount` or explicitly maintain the ref array to match the render list.
