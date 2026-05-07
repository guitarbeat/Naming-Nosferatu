# Cinematic Footer Integration Guide

## Overview
A premium, animated footer component with magnetic button interactions and smooth scroll-triggered animations using GSAP.

## What Was Set Up

### ✅ Dependencies Installed
- `gsap` v3.15.0 - Handles all animations and interactions

### ✅ Files Created
1. **`src/shared/components/ui/cinematic-footer.tsx`** - Main component (391 lines)
   - `CinematicButton` - Magnetic button with 3D perspective effects
   - `CinematicFooter` - Main footer component with animations
   - Theme-adaptive inline styles (glass pills, gradients, etc.)

2. **`src/shared/components/ui/cinematic-footer-demo.tsx`** - Demo page
3. **`src/shared/components/ui/index.ts`** - Export barrel file

### ✅ Project Compatibility
- TypeScript ✅
- Tailwind CSS v4 ✅
- `cn()` utility from `clsx` + `tailwind-merge` ✅
- GSAP with ScrollTrigger plugin ✅

## How to Use

### Basic Implementation
Import and add the footer to any page:

```tsx
import { CinematicFooter } from "@/shared/components/ui";

export default function MyPage() {
  return (
    <div>
      {/* Your main content */}
      <main className="relative z-10 min-h-[120vh]">
        {/* Page content goes here */}
      </main>
      
      {/* Add the footer */}
      <CinematicFooter />
    </div>
  );
}
```

### Important Structure Notes
1. **Wrapper Structure**: The footer uses a `clip-path` technique to create a "curtain reveal" animation
2. **Z-index**: Your main content needs `z-10` to sit above the fixed footer
3. **Height**: Use `min-h-[120vh]` or higher on main content to allow scrolling
4. **Smooth Scroll**: The component includes a "scroll to top" button

## Customization

### Change the Background Text
In `cinematic-footer.tsx`, line ~310:
```tsx
<div className="footer-giant-bg-text ...">
  SOBERS  {/* ← Change this */}
</div>
```

### Customize Marquee Text
Modify the `MarqueeItem` component (line ~203):
```tsx
const MarqueeItem = () => (
  <div className="flex items-center space-x-12 px-6">
    <span>Your Custom Text</span>
    {/* Add more items */}
  </div>
);
```

### Customize Links/Buttons
In the "Secondary Text Links" section (line ~340):
```tsx
<MagneticButton as="a" href="#" className="...">
  Your Link Text
</MagneticButton>
```

### Adjust Colors
The component uses CSS variables that respect your Tailwind theme:
- `--foreground`, `--background` - Main colors
- `--primary`, `--secondary` - Accent colors
- `--destructive` - For the heartbeat animation

Theme adapts automatically to light/dark modes via CSS `color-mix()`.

## Animation Features

1. **Magnetic Buttons** - Mouse movement creates 3D attraction effect
2. **Parallax Background** - Giant text parallaxes as you scroll
3. **Staggered Reveals** - Content fades in with stagger
4. **Marquee Text** - Infinite scrolling text at top
5. **Aurora Glow** - Breathing ambient light effect
6. **Heartbeat Icon** - Pulsing heart in the credits

## Browser Support
- Modern browsers with CSS `backdrop-filter` support
- Graceful fallbacks for grid backgrounds and animations
- Touch-friendly magnetic button behavior

## Performance Notes
- GSAP ScrollTrigger is registered only on client-side
- All animations use GPU-accelerated transforms
- Cleanup on unmount prevents memory leaks
- React Strict Mode compatible

## Responsive Design
- Mobile: Smaller text sizes, adjusted spacing
- Tablet: Medium sizing
- Desktop: Full cinematic experience with parallax

## Next Steps
1. Add to your desired page
2. Customize link destinations and text
3. Adjust colors via Tailwind CSS variables
4. Test scroll interactions
