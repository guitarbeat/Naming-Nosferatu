

# Making Swipe Mode Discoverable

## The Problem
You're right - the swipe functionality exists but it's **hidden from view**! The "Grid" and "Swipe" toggle buttons are rendered at the top of the tournament setup section, but they're:
1. **Easily scrolled past** - they appear above the name cards
2. **Not prominent enough** - small toggle buttons that blend into the header
3. **Not integrated with the navigation** - should be accessible from the bottom nav bar

## Proposed Solution
Integrate the view mode toggle directly into the bottom navigation bar so you can switch between Grid and Swipe modes from anywhere.

## Changes

### 1. Add View Mode Toggle to FluidNav
Add a small toggle or icon button in the navigation bar that switches between Grid and Swipe modes when on the Pick section.

**File:** `source/layout/FluidNav.tsx`
- Add `Layers` icon import (swipe mode indicator)
- When active section is "pick", show a small mode toggle button
- Clicking the toggle switches `isSwipeMode` in the store

### 2. Improve Toggle Visibility in ManagementMode  
Make the existing toggle more prominent and sticky so it doesn't scroll away.

**File:** `source/features/tournament/modes/ManagementMode.tsx`
- Add `sticky top-0` positioning to the toggle header
- Increase visual prominence with better contrast
- Add a subtle animation when the mode changes

### 3. Alternative: Add Swipe Icon to the Main Pick Button
When on the Pick section, add a long-press or secondary action to switch modes.

---

## Visual Flow

```text
┌─────────────────────────────────────────────┐
│  Current State (Hard to Find)               │
│                                             │
│  [Grid] [Swipe]  ← Scrolled off screen      │
│  ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │ Cat │ │ Cat │ │ Cat │  ← You see this    │
│  └─────┘ └─────┘ └─────┘                    │
│                                             │
│  ═══════════════════════════════════════    │
│  [Pick]  [Suggest]  [Profile]   ← No toggle │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Proposed State (Always Visible)            │
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │ Cat │ │ Cat │ │ Cat │                    │
│  └─────┘ └─────┘ └─────┘                    │
│                                             │
│  ═══════════════════════════════════════    │
│  [Pick 📋]  [Suggest]  [Profile]            │
│       ↑                                     │
│   Long-press or tap icon to toggle:         │
│   📋 Grid ↔ 🃏 Swipe                        │
└─────────────────────────────────────────────┘
```

---

## Implementation Details

### FluidNav.tsx Changes
```typescript
// Add swipe mode toggle when on pick section
const isSwipeMode = useAppStore((state) => state.ui.isSwipeMode);
const setSwipeMode = useAppStore((state) => state.uiActions.setSwipeMode);

// In the Pick button, add a secondary tap target or replace icon based on mode
<AnimatedNavButton
  customIcon={
    <motion.div className="relative">
      {isSwipeMode ? <Layers /> : <LayoutGrid />}
    </motion.div>
  }
  // Double-tap or swipe gesture to toggle mode
/>
```

### ManagementMode.tsx Changes
```typescript
// Make toggle sticky and more prominent
<div className="sticky top-0 z-10 flex items-center justify-between 
                gap-4 px-4 py-3 bg-black/80 backdrop-blur-xl 
                border-b border-white/10 rounded-t-2xl">
  {/* Toggle buttons with better styling */}
</div>
```

---

## Quick Fix vs Full Solution

**Quick Fix (Recommended First):**
- Make the existing toggle sticky so it stays visible when scrolling
- This is a 1-line CSS change

**Full Solution:**
- Add view mode toggle to the navigation bar
- More discoverable but requires more changes

---

## Files to Modify
1. `source/features/tournament/modes/ManagementMode.tsx` - Make toggle sticky + more visible
2. `source/layout/FluidNav.tsx` - Add view mode indicator/toggle to nav

