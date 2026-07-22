💡 What:
- Extracted the scattered inline `SectionHeading` component from `HomeRoute` into a unified `components/ui/SectionHeading.tsx` reusable component.
- Reduced excessive vertical padding (`min-h-[100dvh] py-12` -> `min-h-[80dvh] py-8`) between homepage sections to compress the scanning path and tighten up the layout.
- Added a subtle rotational spring animation on hover for `MagicToggle` to make interaction feel more playful and tactile.

🎯 Why:
- Fulfills the 'continuous UI prune' trigger instructions to group like features, clean up the main view file, and make inputs like the toggle feel "magic to touch".
- The tighter vertical rhythm gives the page more momentum when scrolling through the sections.

📸 Before/After:
Before: `SectionHeading` was inlined. Sections had forced 100dvh heights causing huge gaps. Toggle was a static scale.
After: `SectionHeading` is shared. Sections flow cleanly. Toggle wriggles slightly on hover.

♿ Accessibility:
- No structural or ARIA regressions. Kept the toggle tab roles intact.
