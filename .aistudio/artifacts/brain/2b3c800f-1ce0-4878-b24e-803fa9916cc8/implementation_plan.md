# Name Nosferatu: Backend Simplification & Storage Error Fix

Eliminate the storage JSON parsing syntax errors caused by legacy transient AES encryption, streamline data persistence, and remove redundant duplicate modules while strictly preserving the visual design and UI components.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Priority Error Resolution**: The runtime error (`SyntaxError: Unexpected non-whitespace character after JSON at position 5`) is directly caused by `storage.ts` attempting to `JSON.parse` legacy encrypted strings (`[32-hex-iv]:[ciphertext]`) that failed AES decryption due to an in-memory session key changing across reloads.
> Our revised plan adds an immediate safe legacy-sanitization layer that catches and purges corrupted/encrypted strings on startup without logging unhandled exceptions or breaking the initial tournament state.

- **Confirmed Decision 1**: Keep the existing visual design and user interface 100% intact (gothic aesthetic, iridescence effects, drift wall, tournament arena, bracket modals).
- **Confirmed Decision 2**: Fix localStorage JSON parsing errors immediately by removing the volatile random AES layer, adding defensive checks for legacy encrypted strings, and simplifying to clean, typed JSON storage.
- **Confirmed Decision 3**: Eliminate duplicate parallel modules (`src/Providers.tsx`, duplicate `api.ts`, duplicate `hooks.ts`) and streamline the Zustand store.

---

## 1. Root Cause & Error Fix Strategy

### Root Cause
1. `src/lib/storage.ts` previously encrypted strings with `CryptoJS.AES` using `CryptoJS.lib.WordArray.random(32)`, a key generated fresh in memory during each session.
2. When the user reloads the app, the key in memory is brand new. Decryption of previously persisted localStorage strings fails.
3. The fallback in `decrypt()` returned the raw ciphertext (e.g. `7a1e0...:U2FsdGVkX1...`).
4. `readStorageJson()` passed this raw ciphertext directly into `JSON.parse()`, triggering:
   `SyntaxError: Unexpected non-whitespace character after JSON at position 5 (line 1 column 6)`.

### Fix Implementation
1. **Defensive Legacy Purge**: In `getStorageString` and `readStorageJson`, detect legacy ciphertext strings (matching the `[32-char hex]:[base64]` signature) or invalid non-JSON strings; automatically purge them from localStorage and return the fallback value gracefully without noisy console errors.
2. **Plain Typed JSON Storage**: Store data directly as plain, robust JSON with standard `try/catch` quota management and memory fallback.
3. **Graceful Store Booting**: Ensure `getInitialTournamentState()` in `src/store/index.ts` safely handles null/fallback snapshots so the app boots smoothly every time.

---

## 2. Codebase Simplification & Slop Removal

### Consolidate Duplicate Files
- Remove root `src/Providers.tsx` (preserving `src/components/Providers.tsx` which is already wired into `src/components/index.ts`).
- Unify `src/api.ts` and `src/lib/api.ts` into a single authoritative module with clean backward-compatible exports.
- Unify `src/lib/hooks.ts` and `src/hooks.ts` into a single authoritative module.

### Clean Storage & Zustand Store
- Streamline `src/lib/storage.ts` to ~120 lines of clean, reliable, typed localStorage and IndexedDB helpers.
- Remove `crypto-js` and `@types/crypto-js` from `package.json`.
- Simplify `src/store/index.ts` to clean, idiomatic Zustand slices without manual diffing loops or redundant abstraction layers.

---

## 3. Technical Architecture & System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       UI Layer                              │
│   HomeView  ·  TournamentArena  ·  TournamentBracket       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Simplified Zustand Store                    │
│   TournamentSlice  ·  UserSlice  ·  UISlice  ·  ErrorSlice  │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   Safe Clean Storage Layer   │ │     Query / API Layer      │
│  · Quota-safe JSON Storage   │ │  · Candidate Names Query   │
│  · Legacy String Sanitizer   │ │  · Ratings Sync API        │
│  · IndexedDB Tournament DB   │ │                            │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 4. Verification & Testing

1. Verify `compile_applet` builds successfully with zero errors.
2. Verify `lint_applet` passes Biome, TypeScript (`tsc --noEmit`), and Knip checks.
3. Verify `npm test` passes all unit tests, updating any tests targeting storage to verify the clean JSON and legacy sanitation behavior.
4. Verify the dev server loads without the `SyntaxError: Unexpected non-whitespace character after JSON` error in console.
