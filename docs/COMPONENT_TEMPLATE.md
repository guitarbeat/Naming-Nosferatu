# Component Name

Brief description of what the component does.

## Purpose
- Why does this component exist?
- When should it be used?
- Context/usage guidelines (e.g., "Use this for primary actions, but use X for secondary").

## Props/Parameters

| Prop Name | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `exampleProp` | `string` | `undefined` | Yes | Description of what this prop does. |
| `optionalProp` | `boolean` | `false` | No | Description of optional behavior. |

## Usage Examples

### Basic Usage

```jsx
import { ComponentName } from "@/shared/components/ComponentName";

<ComponentName exampleProp="value" />
```

### With Optional Props

```jsx
<ComponentName 
  exampleProp="value" 
  optionalProp={true} 
/>
```

## Accessibility (A11y)
- [ ] ARIA roles/attributes used
- [ ] Keyboard navigation support
- [ ] Screen reader considerations
- [ ] Focus management

## Edge Cases
- What happens when text is too long?
- How does it behave in loading/disabled states?
- Mobile vs Desktop differences?
