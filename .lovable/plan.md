

# Use All Existing Components and Patterns

## Summary
After a thorough audit, most components ARE used -- but several are underutilized or bypassed by raw HTML/CSS in places where the existing components should be used instead.

## Changes

### 1. TournamentFlow.tsx - Use Section component instead of raw `<section>` tags
**File:** `source/features/tournament/modes/TournamentFlow.tsx`

Currently uses raw `<section>` tags with inline classes (lines 24-25, 112-113). Replace with the `Section` component that was built for exactly this purpose.

- Tournament area section -> `<Section id="tournament-area" variant="minimal" padding="compact">`
- Suggest section -> `<Section id="suggest" variant="minimal" padding="comfortable" separator>`
- Remove the manual padding/centering classes since `Section` handles this

### 2. TournamentFlow.tsx - Use GlassPresets for Card glass background
**File:** `source/features/tournament/modes/TournamentFlow.tsx` (line 36)

The tournament complete card uses `<Card background="glass">` which falls back to hardcoded glass defaults in Card.tsx. Instead, pass the standardized glass preset:
```tsx
<Card liquidGlass={getGlassPreset("card")} padding="xl" shadow="xl" enableTilt>
```

### 3. NameSuggestion.tsx - Use X icon from icons module instead of raw SVG
**File:** `source/features/tournament/components/NameSuggestion.tsx` (lines 242-252)

The modal close button renders an inline SVG. Replace with the `X` icon already exported from `source/icons.ts`:
```tsx
import { X } from "@/icons";
// ...
<X size={24} />
```

### 4. NameSuggestion.tsx - Use Button component for Cancel button
**File:** `source/features/tournament/components/NameSuggestion.tsx` (lines 319-325)

The modal's Cancel button uses a raw `<button>` with hand-written styles. Replace with the existing `Button` component using the `ghost` variant for consistency.

### 5. ProfileSection.tsx - Use Button for Cancel button
**File:** `source/features/tournament/components/ProfileSection.tsx` (lines 110-116)

Same pattern - raw `<button>` for Cancel instead of `Button variant="ghost"`.

### 6. ManagementMode.tsx - Use EmptyState for error display
**File:** `source/features/tournament/modes/ManagementMode.tsx` (lines 78-93)

The error state is a hand-rolled div. Replace with the existing `EmptyState` component which was designed for exactly this:
```tsx
<EmptyState
  title="Error Loading Names"
  description={error?.message || "Please try again later"}
  icon="⚠️"
  action={<Button variant="danger" onClick={() => { clearErrors(); refetch(); }}>Retry</Button>}
/>
```

### 7. TournamentFlow.tsx - Use Section wrapper for the outer container
**File:** `source/features/tournament/modes/TournamentFlow.tsx` (line 20)

The outermost `<div>` with `max-w-6xl mx-auto flex flex-col gap-8 min-h-[80vh] py-8` duplicates what `Section` already provides. Simplify by using Section's `maxWidth` and `padding` props.

---

## Files Modified
1. `source/features/tournament/modes/TournamentFlow.tsx` - Use Section, GlassPresets, simplify container
2. `source/features/tournament/components/NameSuggestion.tsx` - Use X icon, Button for Cancel
3. `source/features/tournament/components/ProfileSection.tsx` - Use Button for Cancel
4. `source/features/tournament/modes/ManagementMode.tsx` - Use EmptyState for error

## Impact
- 6 places where raw HTML is replaced with existing reusable components
- More consistent styling across the app
- Better use of the component library that was already built
