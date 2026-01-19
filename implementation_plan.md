# Refactor Ambiguous Naming Plan

## Goal
Improve code readability by renaming generic variables (`data`, `temp`, `obj`, `res`, `item`) to descriptive names based on their context.

## User Review Required
> [!NOTE]
> This is a pure refactor. No logic changes are intended.

## Proposed Changes

### 1. `source/shared/utils/basic.ts`
- Rename `temp` -> `swapTemp` (Line 23)

### 2. `source/features/auth/hooks/authHooks.ts`
- Rename `data` -> `catFactData` (Line 35, 37, 38) in `useCatFact`

### 3. `source/core/store/slices/settingsSlice.ts`
- Rename `data` -> `chosenNameData` (Line 106, 108, 111) in `loadCatChosenName`

### 4. `source/features/auth/utils/authUtils.ts`
- Rename `obj` -> `errorObj` (Line 119, 123-143, 154-160, 190) in `extractErrorMetadata`
    - Context: It's iterating over error objects to extract metadata.

### 5. `source/shared/components/Gallery.tsx`
- Rename `res` -> `manifestResponse` (Line 56, 57, 58) in `useImageGallery`
- Rename `data` -> `uploadResult` (Line 191, 192, 193) in `PhotoGallery`

### 6. `source/shared/components/NameSuggestionModal/NameSuggestionModal.tsx`
- Rename `res` -> `submissionResult` (Line 64, 70, 71) in `NameSuggestionModal`

### 7. `source/core/hooks/useStorage.ts`
- Rename `item` -> `storedJson` (Line 24, 25, 28, 30) in `useLocalStorage`

### 8. `source/shared/navigation/transform.ts`
- Rename `item` -> `navItem` (Line 75, 76, 79, 80) in `findNavItem`

## Verification Plan
1.  **Automated Tests**: Run `npm run lint` and `npm run test` (if available/speedy) or `npm run type-check` (via `npm run lint:types`).
2.  **Manual Verification**: code review the changes to ensure no references were missed.
