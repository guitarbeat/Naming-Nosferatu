# DESIGN.md - Naming Nosferatu

## Context (from discovery)
- Artifact type: Voting App / Tournament Bracket
- Positioning: Playful, community-driven, fun, casual
- Audience: Cat lovers, casual gamers, internet communities | Primary action: Voting for cat names
- Adjectives: Soft, quirky, bouncy, cute, warm
- Visual word translations: 
  - Soft -> rounded corners, pill shapes, gentle gradients
  - Quirky -> slightly imperfect layout, playful typography, unexpected micro-interactions
  - Bouncy -> spring physics on interactions, oversized interactive elements
  - Cute -> warm pastel color palette, kawaii-inspired iconography
  - Warm -> off-white/cream backgrounds instead of pure white/black, low-contrast shadows
- Aesthetic essence: Warm, Bubbly, Playful
- Single-minded proposition: The most delightful way to name a cat.
- Archetype: Jester / Innocent
- References: admire [Fall Guys UI for chunkiness and bounce, Animal Crossing for soft warmth]; avoid [corporate SaaS dashboards, aggressive gamer aesthetics]
- Mode: Light | Density: Airy
- Constraints: Must be highly accessible for casual users, mobile-first priority for voting interactions, fast performance for rapid voting.

## Aesthetic
- Direction: Soft Kawaii / Bubbly Playful
- Defining trait: Everything is pill-shaped or heavily rounded; no sharp corners.
- Signature move: Oversized, deeply squishy "vote" buttons that depress significantly on active state.

## Typography
- Display: Fredoka | source: Google Fonts | license: OFL
- Body: Quicksand | source: Google Fonts | license: OFL
- Scale: ratio 1.25 Major Third, base 16px
  | | | | | |
  |------|------|-------------|-----|---|
  | display | 49px | 3.05 | hero | |
  | h1 | 39px | 2.44 | page title | |
  | h2 | 31px | 1.95 | section | |
  | body | 16px | 1.6 | text | |
  | small | 13px | 1.5 | meta | |
- Weights: 500/700 | Measure: 60-70ch | Tracking notes: Slightly tight on display for a bubblier feel, open on body for legibility.

## Color
- Strategy: Warm pastel base with vibrant but soft candy-colored accents. Avoids default indigo and pure white/black.
- Distribution: 60 warm cream neutral / 30 soft pink/lilac / 10 vibrant mint/yellow accent
- Palette (role -> OKLCH | hex):
  - bg: oklch(0.97 0.01 90) | #FDFBF7 (Warm Cream)
  - surface: oklch(0.99 0.005 90) | #FFFEFD (Off-White Surface)
  - fg: oklch(0.3 0.02 280) | #4A4652 (Soft Eggplant/Charcoal for high contrast)
  - muted: oklch(0.85 0.02 90) | #DFDCD7 (Warm Gray)
  - border: oklch(0.92 0.02 90) | #F0EDE8 (Subtle Warm Border)
  - accent: oklch(0.75 0.15 350) | #FF9EC2 (Bubblegum Pink)
  - accent-fg: oklch(0.98 0.01 350) | #FFF2F6 (Light Pink fg)
  - secondary-accent: oklch(0.8 0.12 160) | #78E0A0 (Mint Green)
  - success / warning / error: success oklch(0.8 0.12 160) | #78E0A0, warning oklch(0.85 0.15 80) | #FAD85D, error oklch(0.65 0.2 25) | #FF6B6B

## Spacing, radius, shadow
- Spacing base: 8px, scale: 4, 8, 12, 16, 24, 32, 48, 64
- Radius: 24px for large containers, Pill (9999px) for buttons and tags. No sharp corners.
- Shadow approach: Soft elevation -> Large, highly diffuse shadows colored with the brand tint (e.g., a faint pink or purple shadow rather than pure black gray).

## Layout and composition
- Grid: Modular / Bento for dashboards, single-column stacked for voting arena | gutters/margins: 24px
- Spacing rhythm: Loose-between / tight-within. Give components breathing room to feel airy.
- Signature layout move: Floating pill-shaped nav bar at the bottom for mobile, floating top pill for desktop.
- Density: Airy | Scanning: F
- Responsive: Mobile-first | breakpoints: sm: 640px, md: 768px, lg: 1024px

## Components and states
- Button hierarchy: 
  - Primary: Filled Bubblegum Pink, chunky, pill-shaped.
  - Secondary: Mint Green or Soft Gray, filled.
  - States: hover (slight scale up 1.05, brighter), active (scale down 0.95, depressed shadow).
- Inputs: Pill-shaped, thick border on focus (Bubblegum Pink), no default outline.
- Cards: White surface, 24px radius, soft tinted shadow.
- Empty / loading / error: 
  - Loading: Bouncing cat face icon.
  - Empty: Soft illustration of a sleeping cat.
  - Error: Startled cat icon.

## Motion
- Duration scale: normal (300ms) for most, fast (150ms) for micro, slow (500ms) for page transitions.
- Easing: Spring-like (e.g., cubic-bezier(0.34, 1.56, 0.64, 1)) for bouncy feel.
- What animates: Transform (scale, translate) and opacity.
- Signature motion: Voting buttons physically compress (scale down Y slightly) and bounce back when clicked.

## Iconography
- Set: Phosphor (Duotone) | grid: 24px | stroke: 2px | caps/joins: round | radius match: yes (rounded)

## Imagery and illustration
- Mode: Soft vector illustrations or masked photography with rounded organic blob frames.
- Rules: High brightness, warm grading. No hard square crops.
- Avoid: Corporate Memphis, rigid geometric patterns.
- Text-over-image contrast: Always use a blurred overlay or solid soft background behind text.

## Dark mode (if in scope)
- *Skipped for initial MVP to focus on perfect light mode warm/kawaii vibe. Can add a deep purple "midnight" mode later.*

## Accessibility
- Contrast: AA verified for text (Eggplant on Cream passes easily).
- Keyboard: Fully operable | Targets: Minimum 48px for all interactive elements (chunky buttons).
- Color independence: Yes | Reduced motion: Fade swap only.

## Tokens (source of truth)
```css
:root {
  --font-display: 'Fredoka', sans-serif;
  --font-body: 'Quicksand', sans-serif;
  
  /* OKLCH Colors */
  --bg: 0.97 0.01 90;
  --surface: 0.99 0.005 90;
  --fg: 0.3 0.02 280;
  --muted: 0.85 0.02 90;
  --border: 0.92 0.02 90;
  --accent: 0.75 0.15 350;
  --accent-fg: 0.98 0.01 350;
  
  --radius-sm: 12px;
  --radius-md: 24px;
  --radius-lg: 32px;
  --radius-pill: 9999px;
  
  --shadow-soft: 0 10px 40px -10px oklch(0.75 0.15 350 / 0.15);
  --shadow-hover: 0 20px 40px -10px oklch(0.75 0.15 350 / 0.25);
}
```
- Adapter: Tailwind v4 @theme (Custom mapping in index.css / tailwind config)

## Cards and surfaces
- Cards/surfaces: Soft shadow (no border), 24px radius, 24px padding | nesting: avoid cards-in-cards, use color fills for internal grouping.

## Slop audit
- Date: 2026-09-07 | Result: Pass
- Notes: Ensured no default indigo, pure black, or rigid sharp corners. Established a clear, distinct aesthetic identity based on softness and bounce.

## Changelog
- 2026-09-07: Initial creation of DESIGN.md based on Soft Kawaii aesthetic discovery.
