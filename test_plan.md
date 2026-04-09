1. **Analyze the Issue:** The issue describes an N+1 mutation problem in `AdminDashboard.tsx` during bulk "unlock/lock" operations. The current code loops through `ids` and awaits `handleToggleLocked` sequentially.
2. **Create Supabase RPC:** Create a new migration file to define a `batch_update_name_locked` RPC in Supabase, similar to the existing `batch_update_name_visibility`. This RPC should accept an array of UUIDs and a boolean `is_locked`, updating the `cat_names.locked_in` column. It should also create an audit log entry for the operation.
3. **Add API Function:** Add a new exported async function `batchUpdateLocked` to `src/features/names/mutations.ts`. This function will call the new `batch_update_name_locked` RPC using `withSupabase`.
4. **Add Unit Tests:** Add unit tests for `batchUpdateLocked` in `src/features/names/mutations.test.ts`.
5. **Update AdminDashboard:** Modify `src/features/admin/AdminDashboard.tsx` to:
    - Add a new `useMutation` for `batchUpdateLocked` (e.g., `batchLockedMutation`).
    - Update `handleBulkAction` to use the new mutation for "unlock" and "lock" actions instead of looping.
6. **Complete pre commit steps:** Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.
