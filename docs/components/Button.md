# Button

Unified button component system that wraps shadcn/ui buttons to provide consistent styling, accessibility, and behavior across the application.

## Purpose
- **Primary Interaction Element**: Used for triggering actions like submitting forms, navigating, or initiating processes.
- **Consistency**: Enforces a standard set of variants and sizes to maintain UI uniformity.
- **Enhanced Functionality**: Includes built-in support for loading states, icons, and specialized variants like `login`.

## Props/Parameters

| Prop Name | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | - | Yes | The content to be rendered inside the button. |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'login'` | `'primary'` | No | Visual style variant of the button. |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | No | Size of the button. |
| `disabled` | `boolean` | `false` | No | Disables the button and prevents user interaction. |
| `loading` | `boolean` | `false` | No | Shows a loading spinner and disables the button. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | No | HTML button type attribute. |
| `className` | `string` | `''` | No | Additional CSS classes for custom styling. |
| `onClick` | `(event: MouseEvent) => void` | - | No | Click handler function. |
| `startIcon` | `ReactNode` | `null` | No | Icon to display before the button text. |
| `endIcon` | `ReactNode` | `null` | No | Icon to display after the button text. |
| `iconOnly` | `boolean` | `false` | No | If true, optimized for rendering a single icon (sets size to 'icon'). |

## Usage Examples

### Basic Usage

```jsx
import Button from "@/shared/components/Button/Button";

<Button onClick={() => console.log('Clicked')}>
  Click Me
</Button>
```

### With Variants and Icons

```jsx
import { Mail, Trash2 } from "lucide-react";

// Secondary with Start Icon
<Button variant="secondary" startIcon={<Mail />}>
  Send Email
</Button>

// Danger with End Icon
<Button variant="danger" endIcon={<Trash2 />}>
  Delete Item
</Button>
```

### Loading State

```jsx
<Button loading={isLoading} onClick={handleSubmit}>
  Submit Form
</Button>
```

### Icon Only

```jsx
import { IconButton } from "@/shared/components/Button/Button";
import { X } from "lucide-react";

<IconButton 
  icon={<X />} 
  ariaLabel="Close Modal" 
  variant="ghost" 
/>
```

## Accessibility (A11y)
- **Keyboard Navigation**: Fully focusable via Tab key (`focus-visible` styles applied).
- **ARIA Labeling**: `IconButton` requires an `ariaLabel` prop to ensure screen readers can announce the button's purpose.
- **Loading State**: When `loading` is true, the button is disabled to prevent duplicate submissions, and a spinner indicates activity.
- **Contrast**: Variants are designed to meet WCAG contrast guidelines.

## Edge Cases
- **Long Text**: Button text will wrap if constrained, but `whitespace-nowrap` prevents it by default. Ensure container width is sufficient or override with custom class if wrapping is needed.
- **Loading & Disabled**: if `loading` is true, `disabled` is effectively ignored (button is disabled either way).
- **Icon Only**: If `iconOnly` is true, `children` are still rendered unless `startIcon` is present, but layout is optimized for a square aspect ratio. Ideally use the `IconButton` helper component.
