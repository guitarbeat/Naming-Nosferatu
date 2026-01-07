# LiquidGlass Component

A React component that creates a liquid glass refraction effect using SVG filters. This replaces the traditional frosted glass blur with a dynamic refraction effect that simulates liquid glass through displacement mapping and chromatic aberration.

## Features

- **Liquid Glass Refraction**: Uses SVG displacement maps to create fluid-like distortion
- **Chromatic Aberration**: RGB channel separation for enhanced visual effect
- **Configurable Presets**: Built-in presets (dock, pill, bubble, free) for common use cases
- **Dynamic Updates**: Automatically updates when props change
- **Responsive**: Debounced window resize handling for optimal performance
- **Browser Compatibility**: Automatic fallback for browsers that don't support `backdrop-filter: url()`
- **Unique IDs**: Each instance uses unique internal IDs to prevent conflicts

## Basic Usage

```jsx
import LiquidGlass from "@/shared/components/LiquidGlass";

function MyComponent() {
  return (
    <LiquidGlass width={336} height={96} radius={16} scale={-110}>
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
      <button onClick={() => updateConfig({ scale: -150 })}>
        Increase Distortion
      </button>

      <LiquidGlass {...config}>
        <div>Your content</div>
      </LiquidGlass>
    </>
  );
}
```

## Props

| Prop            | Type      | Default                 | Description                                                    |
| --------------- | --------- | ----------------------- | -------------------------------------------------------------- |
| `width`         | `number`  | `240`                   | Width of the glass effect in pixels                            |
| `height`        | `number`  | `110`                   | Height of the glass effect in pixels                           |
| `radius`        | `number`  | `42`                    | Border radius in pixels                                        |
| `scale`         | `number`  | `-110`                  | Displacement scale (negative values create refraction effect)  |
| `saturation`    | `number`  | `1.08`                  | Color saturation multiplier (1 = normal)                       |
| `frost`         | `number`  | `0.12`                  | Frost overlay opacity (0-1)                                    |
| `alpha`         | `number`  | `0.64`                  | Displacement map alpha (0-1)                                   |
| `lightness`     | `number`  | `48`                    | Displacement map lightness (0-100)                             |
| `inputBlur`     | `number`  | `14`                    | Input blur for displacement image                              |
| `outputBlur`    | `number`  | `0.9`                   | Output blur for final effect                                   |
| `border`        | `number`  | `0.06`                  | Border width as fraction of size (0-1)                         |
| `blend`         | `string`  | `'soft-light'`          | Blend mode for gradient mixing                                 |
| `xChannel`      | `string`  | `'R'`                   | X displacement channel (R/G/B)                                 |
| `yChannel`      | `string`  | `'B'`                   | Y displacement channel (R/G/B)                                 |
| `chromaticR`    | `number`  | `4`                     | Red channel chromatic aberration offset                        |
| `chromaticG`    | `number`  | `5`                     | Green channel chromatic aberration offset                      |
| `chromaticB`    | `number`  | `6`                     | Blue channel chromatic aberration offset                       |
| `id`            | `string`  | `'liquid-glass-filter'` | Unique ID for the SVG filter (required for multiple instances) |
| `showCrosshair` | `boolean` | `false`                 | Show crosshair pattern overlay                                 |
| `className`     | `string`  | `''`                    | Additional CSS classes                                         |
| `style`         | `object`  | `{}`                    | Inline styles                                                  |

## Presets

The component includes several presets:

- **dock**: Wide, horizontal glass effect (336x96px)
- **pill**: Rounded pill shape (200x80px, radius 40px)
- **bubble**: Circular bubble effect (140x140px, radius 70px)
- **free**: Customizable free-form shape

## How It Works

The component uses SVG displacement maps to create a liquid glass refraction effect:

1. **Displacement Map**: Generates a gradient-based displacement map using red and blue channels
2. **Chromatic Aberration**: Separates RGB channels with different displacement scales to create color separation
3. **Backdrop Filter**: Applies the SVG filter via `backdrop-filter: url(#filter-id)` to refract content behind the glass
4. **Fallback**: Automatically falls back to `blur()` for browsers that don't support `backdrop-filter: url()`

## Browser Support

- **Chromium-based browsers** (Chrome, Edge, Opera): Full support with `backdrop-filter: url()` for true liquid glass effect
- **Firefox/WebKit**: Automatic fallback to `blur()` + `saturate()` for a frosted glass effect
- The component automatically detects browser capabilities and applies the appropriate filter

## Performance

- **Debounced Resize**: Window resize events are debounced (150ms) to prevent performance issues
- **Memoized Operations**: Expensive operations like displacement map generation are memoized
- **Unique IDs**: Each instance uses unique internal IDs to prevent DOM conflicts and enable multiple instances

## Notes

- **Multiple Instances**: Always provide unique `id` props when using multiple `LiquidGlass` components on the same page
- **Best Results**: The effect works best with content that has varying colors/patterns behind it
- **Responsive**: The component automatically handles window resizing with debouncing
- **No Dependencies**: The component has no external dependencies beyond React
