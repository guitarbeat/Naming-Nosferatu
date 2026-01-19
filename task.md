# Task: Refactor Ambiguous Naming

- [x] Analyze context of ambiguous variables <!-- id: 0 -->
- [x] Rename variables to be descriptive <!-- id: 1 -->
    - [x] `temp` -> `swapTemp` (basic.ts)
    - [x] `data` -> `catFactData` (authHooks.ts)
    - [x] `data` -> `chosenNameData` (settingsSlice.ts)
    - [x] `obj` -> `errorObj` (authUtils.ts)
    - [x] `res` -> `manifestResponse` (Gallery.tsx)
    - [x] `data` -> `uploadResult` (Gallery.tsx)
    - [x] `res` -> `submissionResult` (NameSuggestionModal.tsx)
    - [x] `item` -> `storedJson` (useStorage.ts)
    - [x] `item` -> `navItem` (transform.ts)
- [x] Verification <!-- id: 2 -->
    - [x] Run `npm run lint`
    - [x] Ensure no build errors
