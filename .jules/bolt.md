## 2024-05-24 - Reference Equality Short-circuit
**Learning:** Checking for object reference equality (`newItems === oldRankings`) before iterating through arrays in React state comparisons can provide massive performance benefits (over 99% faster) when the component re-renders with the same array reference.
**Action:** Always add a fast-path reference equality check at the top of array comparison functions, especially those used in React effects or `memo` comparisons.

## 2024-08-19 - CI Version Conflicts
**Learning:** CI failures (`ERR_PNPM_BAD_PM_VERSION`) occur when pnpm action setup explicitly specifies a version but `package.json` packageManager specifies another.
**Action:** Do not forcefully resolve CI configuration issues during a feature branch unless explicitly asked, as modifying `package.json` or `.github/workflows` causes mass lockfile updates and out-of-scope diffs. Revert changes to stick strictly to the target objective.
