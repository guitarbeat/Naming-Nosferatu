## 2024-07-14 - Cache Key Sort Determinism
**Learning:** In `tournamentLogic.ts`, the order of `bracketEntrants` defines matchup seeding. Removing `.sort()` when generating the cache key is not just a performance micro-optimization, but a semantic requirement to avoid cache collisions across seeded bracket permutations.
**Action:** Always question if `.sort()` before caching is functionally required or a bug before removing it.
