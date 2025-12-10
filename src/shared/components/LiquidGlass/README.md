# LiquidGlass Component

A React component that creates a liquid glass refraction effect using SVG filters. This replaces the traditional frosted glass blur with a dynamic, wavy refraction effect that simulates liquid glass.

## Features

- **Liquid Glass Refraction**: Uses SVG turbulence filters to create wavy, fluid-like distortion
- **Chromatic Aberration**: Supports RGB channel separation for enhanced visual effect
- **Configurable Presets**: Built-in presets (dock, pill, bubble, free) for common use cases
- **Dynamic Updates**: Automatically updates when props change
- **Responsive**: Handles window resize events

## Installation

The component uses `gsap` for animations. Make sure it's installed:

```bash
npm install gsap
```

## Basic Usage

```jsx
import LiquidGlass from "@/shared/components/LiquidGlass";

function MyComponent() {
  return (
    <LiquidGlass width={336} height={96} radius={16} turbulence={0.3}>
      <div>Your content here</div>
    </LiquidGlass>
  );
}
```

## Using the Hook

For more control, use the `useLiquidGlass` hook:

```jsx
import LiquidGlass, { useLiquidGlass } from "@/shared/components/LiquidGlass";

function MyComponent() {
  const { config, updateConfig, setPreset } = useLiquidGlass();

  return (
    <>
      <button onClick={() => setPreset("dock")}>Dock</button>
      <button onClick={() => setPreset("pill")}>Pill</button>
      <button onClick={() => updateConfig({ turbulence: 0.5 })}>
        Increase Turbulence
      </button>

      <LiquidGlass {...config}>
        <div>Your content</div>
      </LiquidGlass>
    </>
  );
}
```

## Props

| Prop         | Type     | Default                 | Description                                                                           |
| ------------ | -------- | ----------------------- | ------------------------------------------------------------------------------------- |
| `width`      | `number` | `336`                   | Width of the glass effect in pixels                                                   |
| `height`     | `number` | `96`                    | Height of the glass effect in pixels                                                  |
| `radius`     | `number` | `16`                    | Border radius in pixels                                                               |
| `turbulence` | `number` | `0.3`                   | **Liquid glass specific** - Controls the wavy distortion intensity (replaces `frost`) |
| `scale`      | `number` | `-180`                  | Displacement scale                                                                    |
| `saturation` | `number` | `1`                     | Color saturation                                                                      |
| `alpha`      | `number` | `0.93`                  | Opacity                                                                               |
| `lightness`  | `number` | `50`                    | Lightness value                                                                       |
| `blur`       | `number` | `11`                    | Input blur amount                                                                     |
| `border`     | `number` | `0.07`                  | Border size ratio                                                                     |
| `displace`   | `number` | `0.2`                   | Output blur/displacement                                                              |
| `blend`      | `string` | `'difference'`          | Blend mode                                                                            |
| `xChannel`   | `string` | `'R'`                   | X channel selector (R/G/B)                                                            |
| `yChannel`   | `string` | `'B'`                   | Y channel selector (R/G/B)                                                            |
| `chromaticR` | `number` | `0`                     | Red channel chromatic aberration offset                                               |
| `chromaticG` | `number` | `10`                    | Green channel chromatic aberration offset                                             |
| `chromaticB` | `number` | `20`                    | Blue channel chromatic aberration offset                                              |
| `id`         | `string` | `'liquid-glass-filter'` | Unique ID for the SVG filter                                                          |
| `className`  | `string` | `''`                    | Additional CSS classes                                                                |
| `style`      | `object` | `{}`                    | Inline styles                                                                         |

## Presets

The component includes several presets:

- **dock**: Wide, horizontal glass effect (336x96px)
- **pill**: Rounded pill shape (200x80px, radius 40px)
- **bubble**: Circular bubble effect (140x140px, radius 70px)
- **free**: Customizable free-form shape

## Key Differences from Frosted Glass

- **`turbulence`** replaces `frost`: Controls the wavy, liquid-like distortion
- Uses SVG `feTurbulence` for dynamic wave patterns
- Creates a more organic, fluid appearance compared to static blur
- Better suited for modern, dynamic UI effects

## Browser Support

- **Chromium-based browsers**: Full support (Chrome, Edge, Opera)
- **Firefox/Webkit**: Limited support for `backdrop-filter: url()` - may need fallbacks

## Notes

- The component requires GSAP for filter updates
- Multiple instances should use unique `id` props
- The effect works best with content that has varying colors/patterns behind it
