## 2025-02-23 - Fast Object Validation via Object.keys length short-circuiting

**Learning:** When validating that dynamically-sized objects do not exceed constraints, a standard `for...in` loop requires an internal O(N) counter and processes properties one by one. `Object.entries(obj).length` provides an O(1) size check, but allocates massive tuple arrays. `Object.keys(obj)` provides the same O(1) fail-fast size capability `.length` but with significantly less garbage collection overhead than `.entries()`.
**Action:** When validating API object payloads where early exit bounds (like > 200 items or 0 items) exist, prefer `const keys = Object.keys(obj);` followed by a `.length` bound check *before* looping through data, instead of using `for..in` counting logic.
