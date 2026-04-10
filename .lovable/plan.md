

## Plan: Add mix-blend-mode difference to section headings for background contrast

### Problem
Text in section headings (and potentially other overlaid text) can become hard to read against the animated, colorful background layers (gradient, moire, soft-blur). The user wants text to automatically invert/contrast against whatever background is behind it.

### Approach
Apply `mix-blend-mode: difference` with white text color to key heading elements so they always remain visible regardless of background color changes. This CSS property inverts the text color relative to the background beneath it.

### Changes

**1. `src/shared/components/layout/SectionHeading.tsx`**
- Add `mix-blend-mode: difference` and white text color to the heading container
- The `h2` title and subtitle `p` get `text-white` so the difference blend produces visible inverted colors
- Add an `isolation: isolate` wrapper if needed to scope the blend

**2. `src/styles/components.css` or `src/styles/layout.css`** (whichever holds component styles)
- Add a reusable `.blend-difference-text` utility class:
  ```css
  .blend-difference-text {
    mix-blend-mode: difference;
    color: white;
  }
  ```
- This can be applied to any text element that needs to stay visible against changing backgrounds

**3. `src/features/tournament/components/NameSelector.tsx`** (error/heading text)
- Apply the blend-difference class to the "Failed to load names" heading and any other prominent text that overlays the background directly

### Technical notes
- `mix-blend-mode: difference` with white text effectively inverts the background color for the text pixels, guaranteeing contrast
- Parent elements with `backdrop-filter` or `overflow: hidden` can create new stacking contexts that limit blend scope -- will ensure the blend targets are positioned correctly relative to the background layers
- The icon container in `SectionHeading` will keep its current styling (the circular badge) since blending icons can look odd

