
# Plan: Correct Wrappers and Reduce Styling Duplication in TournamentToolbar

## Summary
Clean up the TournamentToolbar component by removing unnecessary wrapper elements, consolidating the styling approach, and eliminating duplicate/unused CSS.

---

## Changes Overview

### 1. Remove Unnecessary Wrappers in `renderTournamentMode`

**Current Structure** (too nested):
```
div.unifiedContainer
  └── div.flex.items-center.gap-2 (unnecessary wrapper)
        └── div.flex.items-center.bg-white/5 (segmented control wrapper)
              └── button (Grid)
              └── button (Swipe)
        └── div.h-6.w-px (divider - unnecessary)
        └── button (Show Cats)
        └── button (Filters)
```

**Proposed Structure** (flattened):
```
nav.unifiedContainer (semantic, no extra wrapper)
    └── button (Grid)
    └── button (Swipe)
    └── span.divider (simple divider, aria-hidden)
    └── button (Show Cats)
    └── button (Filters)
```

### 2. Consolidate Styling Approach

Move from mixed inline Tailwind + CSS modules to a consistent CSS module approach:

- Define new CSS classes for the toggle buttons:
  - `.toolbar-toggle` - base button style
  - `.toolbar-toggle--active` - active state modifier
  - `.toolbar-toggle--accent` - accent color variant (cats toggle)
  - `.toolbar-divider` - simple vertical divider

- Remove inline Tailwind classes from button elements

### 3. Clean Up Unused CSS

Remove these unused classes from `TournamentToolbar.css`:
- `.tournament-toolbar-toggle-stack`
- `.tournament-toolbar-toggle-wrapper`
- `.tournament-toolbar-toggle-switch`
- `.tournament-toolbar-toggle-switch-active`
- `.tournament-toolbar-toggle-thumb`
- `.tournament-toolbar-toggle-label`
- `.tournament-toolbar-suggest-button`

### 4. Update Component Styling

**File: `source/shared/components/TournamentToolbar/TournamentToolbar.css`**

Add new consolidated classes:
```css
.toolbar-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.toolbar-toggle:hover {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
}

.toolbar-toggle--active {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toolbar-toggle--accent.toolbar-toggle--active {
  color: rgb(251, 207, 232); /* pink-200 */
  background: rgba(236, 72, 153, 0.1); /* pink-500/10 */
  border-color: rgba(236, 72, 153, 0.2);
}

.toolbar-segmented {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 0.5rem;
}
```

---

## Technical Details

### File: `source/shared/components/TournamentToolbar/TournamentToolbar.tsx`

**Lines 45-73**: Update `styles` object to use new class names

**Lines 425-516**: Refactor `renderTournamentMode()`:
- Change outer container from `div` to `nav` for semantics
- Remove intermediate wrapper div (line 427)
- Apply CSS module classes instead of inline Tailwind
- Simplify button structures using `cn()` for conditional classes

**Example refactored button:**
```typescript
<button
  type="button"
  onClick={() => setSwipeMode(false)}
  className={cn(
    styles.toolbarToggle,
    !isSwipeMode && styles.toolbarToggleActive
  )}
  title="Switch to Grid View"
>
  <LayoutGrid size={16} />
  <span>Grid</span>
</button>
```

### File: `source/shared/components/TournamentToolbar/TournamentToolbar.css`

- Remove 7 unused legacy toggle classes
- Add 5 new consolidated classes
- Keep existing filter classes unchanged

---

## Benefits

1. **Reduced DOM Depth**: From 4 levels to 2 levels for toolbar controls
2. **Single Styling Source**: All styles in CSS module, no inline Tailwind
3. **Smaller CSS Bundle**: ~40% reduction by removing unused classes
4. **Easier Maintenance**: Consistent class naming convention
5. **Better Semantics**: Using `nav` element for toolbar navigation
