---
title: Design System
description: Name Nosferatu visual design and component system

# Design Tokens

colors:
  # Core Brand Palette (HSL)
  primary:
    value: "hsl(190, 55%, 34%)"
    description: "Sage green. Primary actions, interactive elements, navigation highlights."
  primary-dark:
    value: "hsl(190, 55%, 25%)"
    description: "Darker primary for interactive states and overlays."
  primary-light:
    value: "hsl(190, 55%, 52%)"
    description: "Lighter primary for hover states and secondary emphasis."
  
  accent:
    value: "hsl(16, 71%, 53%)"
    description: "Coral red. Contrast accent for CTAs, secondary actions, and visual pop."
  accent-dark:
    value: "hsl(16, 71%, 42%)"
    description: "Darker accent for active/pressed states."
  accent-light:
    value: "hsl(16, 71%, 62%)"
    description: "Lighter accent for hover and disabled states."
  
  # Secondary Colors
  success:
    value: "hsl(142, 71%, 45%)"
    description: "Semantic green for confirmations, achievements."
  warning:
    value: "hsl(38, 92%, 50%)"
    description: "Semantic yellow for alerts and cautions."
  destructive:
    value: "hsl(0, 84%, 60%)"
    description: "Semantic red for errors and destructive actions."
  
  # Neutrals (Dark Theme)
  background:
    value: "hsl(222, 30%, 9%)"
    description: "Deepest background, app shell."
  surface:
    value: "hsl(221, 25%, 13%)"
    description: "Primary surface, cards and elevated areas."
  surface-elevated:
    value: "hsl(221, 30%, 17%)"
    description: "Secondary surface for nested or modal content."
  
  foreground:
    value: "hsl(210, 35%, 96%)"
    description: "Primary text color, highest contrast."
  foreground-muted:
    value: "hsl(210, 20%, 70%)"
    description: "Secondary text, lower emphasis."
  foreground-subtle:
    value: "hsl(210, 12%, 45%)"
    description: "Tertiary text, least emphasis."
  
  border:
    value: "rgba(255, 255, 255, 0.12)"
    description: "Default border color, glass and container edges."
  border-strong:
    value: "rgba(255, 255, 255, 0.22)"
    description: "Stronger border for emphasis or focus states."
  
  # Semantic Glass Colors
  glass-bg:
    value: "rgba(23, 27, 35, 0.58)"
    description: "Base glass background with backdrop blur."
  glass-bg-strong:
    value: "rgba(23, 27, 35, 0.74)"
    description: "Elevated glass for modals, floating panels."
  glass-border:
    value: "rgba(235, 241, 247, 0.12)"
    description: "Glass surface edge definition."

typography:
  families:
    sans:
      value: "Space Grotesk, ui-sans-serif, system-ui"
      description: "Primary body font, clean and modern."
    display:
      value: "Syne, var(--font-sans)"
      description: "Display heading font, bold and geometric."
    ui:
      value: "Inter, var(--font-sans)"
      description: "System interface elements, compact and legible."
    mono:
      value: "Space Mono, ui-monospace"
      description: "Code and technical content."
    whimsical:
      value: "Patrick Hand, cursive"
      description: "Playful or casual text, app flavor."
  
  sizes:
    xs:
      value: "0.75rem"
      description: "Tiny labels, badges, captions."
    sm:
      value: "0.875rem"
      description: "Secondary text, descriptions."
    base:
      value: "1rem"
      description: "Body text, default reading."
    lg:
      value: "1.125rem"
      description: "Lead paragraphs, larger body."
    xl:
      value: "1.25rem"
      description: "Subheading secondary."
    2xl:
      value: "1.5rem"
      description: "Subheading primary."
    3xl:
      value: "1.875rem"
      description: "Section heading."
    4xl:
      value: "2.25rem"
      description: "Page heading."
  
  scales:
    h1:
      value: "clamp(1.75rem, 9vw, 9rem)"
      description: "Fluid hero heading, scales with viewport."
    h2:
      value: "clamp(1.7rem, 3vw, 2.55rem)"
      description: "Fluid section heading."
    h3:
      value: "clamp(1.35rem, 2.1vw, 1.95rem)"
      description: "Fluid subsection heading."
  
  weights:
    medium: 500
    semibold: 600
    bold: 700
    extrabold: 800
  
  tracking:
    tight: "-0.02em"
    normal: "0em"
    wide: "0.025em"
    wider: "0.05em"
    caps: "0.11em"
  
  lineHeight:
    tight: 1.08
    normal: 1.5
    copy: 1.6

spacing:
  base-unit:
    value: "0.25rem"
    description: "4px base rhythm for all measurements."
  
  scale:
    1: "0.25rem"
    2: "0.5rem"
    3: "0.75rem"
    4: "1rem"
    6: "1.5rem"
    8: "2rem"
    10: "2.5rem"
    12: "3rem"
    16: "4rem"
    20: "5rem"
    24: "6rem"
    32: "8rem"
    50: "12.5rem"

radius:
  none: 0
  xs: "0.125rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1.5rem"
  full: "9999px"
  
  components:
    button: "0.5rem"
    card: "0.75rem"
    input: "0.5rem"
    surface: "1.5rem"

shadows:
  sm:
    value: "0 1px 3px rgb(0, 0, 0 / 0.25)"
  md:
    value: "0 10px 20px rgb(3, 6, 16 / 0.35)"
  lg:
    value: "0 24px 48px rgb(2, 6, 14 / 0.45)"
  
  glass:
    value: "0 18px 40px rgba(4, 10, 20, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
    description: "Layered shadow for glass surfaces with inset light."
  
  glow-subtle:
    value: "0 0 12px rgba(39, 121, 137, 0.15)"
  glow-medium:
    value: "0 0 20px rgba(39, 121, 137, 0.25)"
  glow-strong:
    value: "0 0 30px rgba(39, 121, 137, 0.35)"

motion:
  easing:
    in-out-smooth: "cubic-bezier(0.4, 0, 0.2, 1)"
    out-expo: "cubic-bezier(0.16, 1, 0.3, 1)"
    out-back: "cubic-bezier(0.34, 1.56, 0.64, 1)"
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  
  duration:
    micro: "80ms"
    quick: "120ms"
    base: "180ms"
    moderate: "250ms"
    gentle: "350ms"
  
  transforms:
    scale-press: "0.97"
    scale-hover: "1.02"
    lift-small: "-2px"
    lift-medium: "-3px"
  
  animations:
    fade-in:
      duration: "300ms"
      easing: "ease-in-out"
    surface-enter:
      duration: "350ms"
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
    genie:
      duration: "600ms"
      easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      description: "Playful expand/collapse from origin point."

zindex:
  base: 0
  sticky: 100
  elevated: 200
  modal-backdrop: 1050
  modal: 300
  drawer: 200
  popover: 400
  toast: 500

breakpoints:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
  2xl: "1536px"

---

## Visual Identity

The Name Nosferatu design system balances **playfulness with sophistication**. The interface uses a dark, modern aesthetic grounded in deep navy-blue backgrounds with sage green and coral accents. Glass morphism surfaces create visual depth and a premium feel while maintaining legibility.

### Design Philosophy

**Form follows function with personality.** Every visual decision serves usability while maintaining the app's whimsical nature. The cat-naming theme allows for playful typography choices and vibrant accent colors without compromising clarity.

- **Minimalist core**: Clean, spacious layouts with generous breathing room
- **Premium surfaces**: Glass and frosted effects create visual hierarchy
- **Considered motion**: Every transition has purpose—no motion for motion's sake
- **Semantic clarity**: Colors and spacing communicate affordance and hierarchy

### Color System

The palette consists of three core families:

1. **Primary (Sage)**: Trust, action, and primary navigation. Used for interactive elements, focus states, and brand presence.

2. **Accent (Coral)**: Energy and warmth. Used for secondary CTAs, visual pop, and highlighting important secondary actions.

3. **Neutrals**: A carefully calibrated grayscale that works across light and dark themes. Deep navy backgrounds provide contrast for light text; muted grays ensure readability.

The dark theme is the default, reflecting modern design trends and providing visual comfort in low-light environments. The system supports a light theme with inverted contrast ratios while maintaining the same color intent.

#### Semantic Colors

- **Success (Green)**: Confirmations, completed tasks, positive feedback
- **Warning (Amber)**: Cautions, alerts, pending states
- **Destructive (Red)**: Errors, deletions, irreversible actions

### Typography

The system uses four font families to create visual rhythm:

- **Space Grotesk** (sans-serif body): Contemporary, clean, and geometric. Default for all body text and UI elements.
- **Syne** (display): Bold, geometric display face for headings. Uppercase treatment reinforces the cat-themed branding.
- **Inter** (UI mono): Compact system font for dense UI, navigation, and tight spaces.
- **Patrick Hand** (whimsical): Playful cursive used sparingly for delightful moments and emphasis.

Headings use fluid typography with `clamp()` functions, scaling responsively from mobile to desktop without media query breakpoints. This creates a cohesive visual hierarchy that adapts gracefully to any screen size.

All type scales include:
- Generous line-height for readability (1.5–1.6 for body, 1.08–1.2 for headings)
- Controlled letter-spacing for personality (headings lean into wide tracking)
- Text wrapping balance to avoid awkward breaks

### Spacing & Rhythm

Spacing builds on a **0.25rem (4px) base unit**, creating a 4-step rhythm:

- **Micro scale** (1–2 units = 0.25–0.5rem): Inline spacing, icon gaps
- **Compact scale** (4–8 units = 1–2rem): Component padding, tight sections
- **Comfortable scale** (12–24 units = 3–6rem): Section padding, breathing room
- **Generous scale** (32+ units = 8rem+): Hero sections, major layout gaps

This system ensures visual consistency without manual tweaking. Every layout naturally aligns to the grid.

### Glass Morphism & Surfaces

Premium glass surfaces are achieved through:

1. **Layered backdrop blur**: `blur(8px)` for base, `blur(18px)` for emphasis
2. **Semi-transparent background**: Color-mixed with surface tones for depth
3. **Subtle borders**: White with 12–22% opacity for definition
4. **Inset highlights**: Radial and linear gradients simulate rim lighting and frost
5. **Layered shadows**: Composite shadows create depth (elevation shadow + ambient shadow)

The Surface component standardizes this pattern, offering:
- **glass** tone: Light, open feeling for secondary content
- **muted** tone: Darker, more contained for emphasis
- **transparent** tone: No background, border only, for minimal presentation

All surfaces respect `prefers-reduced-transparency` media query and degrade gracefully without backdrop-filter support.

### Motion & Interaction

Motion conveys state and guides attention:

- **Hover**: Lift (`-2px` translate) and add glow for interactive elements
- **Press**: Scale to `0.97` for tactile feedback
- **Focus**: 2px ring in primary color with 3px offset
- **Enter**: Fade + scale-up with `surface-enter` animation
- **Dismiss**: Reverse of enter, or `genie-out` for playful exit

All transitions use `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out-smooth) unless a specific feel is needed:
- **Eager actions** use `out-expo` for snappy feedback
- **Playful moments** use `spring` for bouncy, delightful feel
- **Genie animations** use custom easing for magical expand/collapse

Duration defaults to 250ms (`--duration-moderate`) for most interactions, with:
- 80–120ms for micro-interactions (button hover, icon rotation)
- 350ms for larger state changes (modal entry, section transitions)

### Accessibility & Inclusive Design

- **Focus management**: Clear, high-contrast focus rings on all interactive elements
- **Motion respect**: All animations respect `prefers-reduced-motion` media query
- **Color contrast**: Text meets WCAG AA minimum (4.5:1 on dark backgrounds)
- **Touch targets**: Minimum 44–48px for mobile buttons
- **Semantic HTML**: Proper heading hierarchy, ARIA labels, and role attributes

### Component Patterns

#### Buttons

All buttons use consistent sizing and behavior:

- **Small**: 8px height, 0.75rem text, tight spacing
- **Medium**: 9px height, 0.875rem text, normal spacing
- **Large**: 11px height, 1rem text, generous spacing
- **XL**: 12px height, 1.05rem text, spacious

Variants:
- **Primary**: Sage with white text, lift + glow on hover
- **Secondary**: Muted background with border, subtle lift
- **Danger**: Red with white text, aggressive hover state
- **Ghost**: Transparent with accent hover
- **Outline**: Bordered variant for secondary actions
- **Gradient**: Dual-color gradient, strong visual presence
- **Glass**: Frosted glass effect for premium floating CTAs

#### Cards & Surfaces

- **Border**: 1px solid at 12% white opacity
- **Padding**: Scales with density (compact = 1rem, comfortable = 1.5–1.75rem)
- **Radius**: Defaults to 0.75rem, configurable to 1–1.5rem for larger surfaces
- **Background**: Varies by tone and elevation

#### Forms & Inputs

- **Height**: 48px for touch, 36–40px for desktop
- **Radius**: 0.5rem, matching button radius
- **Border**: 1px solid, color-mixed with foreground
- **Focus state**: Primary ring + glow
- **Padding**: Horizontal 1rem, vertical 0.75rem

#### Navigation

The floating navbar uses:
- **Glass shell**: Premium frosted background with layered shadows
- **Pill buttons**: Sage background with coral border on hover, gentle lift
- **Utility buttons**: Muted background, sage highlight on active
- **Safe area**: Respects device notches and bottom nav on mobile

### Responsive Behavior

The design scales gracefully across devices:

- **Mobile-first approach**: Base styles target small screens, enhance upward
- **Fluid typography**: Headings scale with viewport width, no breakpoint jumps
- **Touch-friendly**: 48px minimum touch targets on mobile
- **Adaptive spacing**: Padding and gaps increase on larger screens (up to 2x on desktop)
- **Reflow, don't hide**: Content adapts layout rather than hiding on small screens

Key breakpoints:
- **sm (640px)**: Tablet portrait threshold
- **md (768px)**: Tablet landscape threshold
- **lg (1024px)**: Small desktop threshold
- **xl (1280px)**: Large desktop threshold

---

## Implementation

This design system is fully tokenized in CSS custom properties and integrated with Tailwind CSS. The design is production-ready and requires no additional design tools—copy token values directly into your components.

### Browser Support

- Modern browsers with backdrop-filter support (Chrome 76+, Safari 15+, Firefox 103+)
- Graceful degradation for older browsers (solid backgrounds, no blur)
- Reduced transparency mode support for motion/accessibility preferences
- Safe-area insets for notched devices (iPhone X+)

### Design Intent

Every visual choice reflects the playful-yet-polished personality of a cat naming app. The sage and coral palette feels modern and friendly. Glass surfaces suggest transparency and openness. Generous spacing breathes. Whimsical typography moments (Patrick Hand) remind users this is fun, not serious. Together, these elements create a cohesive, delightful experience that respects both aesthetics and usability.
