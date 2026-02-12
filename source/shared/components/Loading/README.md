# Loading Component

Consolidated loading component that merges LoadingScreen and LoadingSpinner functionality.

## Basic Usage

### Inline Loading (Spinner)
```tsx
import { Loading } from '@/layout/FeedbackComponents';

// Simple inline spinner
<Loading />

// With size
<Loading size="sm" />
<Loading size="md" />
<Loading size="lg" />

// With message
<Loading message="Loading data..." />
<Loading size="lg" message="Please wait..." />
```

### Fullscreen Loading (Overlay)
```tsx
// Fullscreen loading overlay
<Loading variant="fullscreen" />

// With message
<Loading variant="fullscreen" message="Initializing..." />

// With size
<Loading variant="fullscreen" size="lg" message="Loading tournament..." />
```

## API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'inline' \| 'fullscreen' \| 'spinner' \| 'cat' \| 'bongo' \| 'suspense' \| 'skeleton' \| 'card-skeleton'` | `'inline'` | Loading variant. Use `'inline'` for spinner or `'fullscreen'` for overlay |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the loading indicator |
| `message` | `string` | `undefined` | Optional message to display |
| `className` | `string` | `''` | Additional CSS classes |

### Requirements Satisfied

- ✅ **Requirement 3.1**: Merges LoadingScreen and LoadingSpinner functionality
- ✅ **Requirement 3.2**: Implements variant prop for 'inline' and 'fullscreen' modes
- ✅ **Requirement 3.4**: Supports size prop (sm, md, lg) and optional message prop

## Examples

### Basic Inline Spinner
```tsx
<Loading />
```

### Fullscreen Loading with Message
```tsx
<Loading 
  variant="fullscreen" 
  size="lg" 
  message="Loading your data..." 
/>
```

### Small Inline Spinner
```tsx
<Loading size="sm" message="Saving..." />
```

## Backward Compatibility

The component maintains backward compatibility with the existing API:
- `text` prop (deprecated, use `message` instead)
- `overlay` prop (deprecated, use `variant="fullscreen"` instead)
- Size values: `'small'`, `'medium'`, `'large'` (use `'sm'`, `'md'`, `'lg'` instead)
- Other variants: `'spinner'`, `'cat'`, `'bongo'`, `'suspense'`, `'skeleton'`, `'card-skeleton'`
