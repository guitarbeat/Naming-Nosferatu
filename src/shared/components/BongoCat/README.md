# Enhanced Bongo Cat Component

An advanced typing visualization component featuring a responsive animated cat that reacts to user typing patterns, cursor movement, and contextual events.

## Features

### Visual Enhancements

- **Fluid Animations**: Natural head tilts, ear twitches, tail swishes, and breathing effects
- **Eye Tracking**: Eyes follow cursor movement for engaging interaction
- **Idle Breathing**: Subtle breathing animation when the cat is idle
- **Smooth Transitions**: Seamless state transitions between different emotional states

### Interactive Features

- **Typing Speed Detection**: Reacts differently to slow vs fast typing
  - Slow typing (< 2 CPS): Calm, relaxed animations
  - Normal typing (2-6 CPS): Standard animations
  - Fast typing (> 6 CPS): Excited, energetic animations
- **Backspace Detection**: Shows confused expression when backspace is pressed
- **Long Pause Detection**: Automatically enters sleepy state after 5 seconds of inactivity
- **Milestone Celebrations**: Special celebration animations at typing milestones (10, 25, 50, 100, 250, 500, 1000 characters)
- **Time-Based Moods**: Adjusts behavior based on time of day
  - Morning (6-11 AM): More energetic
  - Afternoon (12-5 PM): Playful
  - Evening (6-10 PM): Slightly calmer
  - Night (11 PM-5 AM): Sleepy mode

### Technical Specifications

- **60fps Performance**: Optimized animations using `requestAnimationFrame`
- **File Size**: CSS-only animations, no external dependencies
- **Responsive**: Adapts to different screen sizes
- **Accessibility**: Supports `prefers-reduced-motion` media query

### Customization Options

- **Cat Variants**: 6 color schemes (black, white, orange, gray, calico, siamese)
- **Personality Modes**: 3 personality types
  - `playful`: Balanced, energetic animations
  - `sleepy`: Calm, relaxed animations
  - `energetic`: Fast, excited animations
- **Size Control**: Adjustable size via `size` prop
- **Position Control**: Automatic positioning relative to form elements
- **Sound Effects**: Optional sound effects toggle (ready for implementation)
- **Motion Reduction**: Respects system preferences and can be manually disabled

## Usage

### Basic Usage

```jsx
import BongoCat from "@components/BongoCat";

<BongoCat
  size={0.5}
  color="#ff6b9d"
  containerRef={containerRef}
/>
```

### Advanced Usage

```jsx
import BongoCat from "@components/BongoCat";

<BongoCat
  size={0.5}
  variant="calico"
  personality="energetic"
  reduceMotion={false}
  enableSounds={false}
  containerRef={containerRef}
  onBongo={() => console.log("Cat is typing!")}
/>
```

## Props

| Prop           | Type        | Default     | Description                                                                |
| -------------- | ----------- | ----------- | -------------------------------------------------------------------------- |
| `size`         | `number`    | `0.5`       | Base size multiplier (0.1 - 2.0)                                           |
| `color`        | `string`    | `"#000"`    | Custom color (overridden by `variant`)                                     |
| `variant`      | `string`    | `"black"`   | Cat color variant: `black`, `white`, `orange`, `gray`, `calico`, `siamese` |
| `personality`  | `string`    | `"playful"` | Personality mode: `playful`, `sleepy`, `energetic`                         |
| `reduceMotion` | `boolean`   | `false`     | Disable animations (also respects system preference)                       |
| `enableSounds` | `boolean`   | `false`     | Enable sound effects (ready for future implementation)                     |
| `containerRef` | `RefObject` | `null`      | Reference to container element for positioning                             |
| `onBongo`      | `function`  | `undefined` | Callback when cat starts typing                                            |

## Animation States

The cat automatically transitions between these states:

- `idle`: Default state with breathing animation
- `typing-slow`: Calm typing animations
- `typing-fast`: Excited, fast typing animations
- `backspace`: Confused expression when deleting
- `sleepy`: Sleepy state after long pause
- `celebrating`: Celebration animation for milestones
- `excited`: High-energy state

## Performance Optimization

- Uses `requestAnimationFrame` for smooth 60fps animations
- Throttled event handlers to prevent excessive reflows
- CSS transforms for hardware acceleration
- Respects `prefers-reduced-motion` for accessibility
- Optimized ResizeObserver usage
- Debounced scroll and resize handlers

## Accessibility

- Automatically detects `prefers-reduced-motion` system preference
- Can be manually disabled via `reduceMotion` prop
- All animations respect reduced motion settings
- Semantic HTML with proper ARIA labels

## Browser Support

- Modern browsers with CSS transforms support
- Requires `requestAnimationFrame` API
- Requires `ResizeObserver` API (with polyfill for older browsers)

## Implementation Notes

- The component uses CSS custom properties for theming
- Animation states are managed by the `useBongoCat` hook
- Cursor tracking uses throttled `mousemove` events
- Typing speed is calculated over a rolling 2-second window
- Milestone detection triggers celebration animations automatically

## Future Enhancements

- Sound effects implementation
- Additional cat variants
- Custom animation sequences
- User-defined milestone thresholds
- Animation speed controls
