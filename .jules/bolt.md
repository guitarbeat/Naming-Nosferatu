## 2025-03-05 - Optimizing Leaderboard Rendering
**Learning:** Chaining `.filter().slice().map()` on leaderboard arrays (e.g. in `WinLossChart.tsx`) scales poorly since it executes an O(N) pass across the entire dataset before slicing. Using a short-circuiting O(limit) `for` loop avoids these full-array iterations and eliminates intermediate array memory allocations entirely.
**Action:** Always prefer a single fast-path sequential loop with short-circuiting over chained array methods when operating on large datasets bounded by a `limit`.
