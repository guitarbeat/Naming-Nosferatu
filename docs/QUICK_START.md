# Readability Tools - Quick Start Guide

Get started with readability checking in 5 minutes.

## Installation

The tools are already included in the project. No installation needed!

## Basic Usage

### 1. Import the Component

```jsx
import { ReadabilityChecker } from '@/shared/components';
```

### 2. Add to Your Component

```jsx
function MyComponent() {
  const buttonText = "Start Tournament";
  
  return (
    <>
      <button>{buttonText}</button>
      <ReadabilityChecker text={buttonText} type="button" />
    </>
  );
}
```

That's it! The checker will show ✅ if text is good, or ⚠️ with suggestions if it needs improvement.

## Common Use Cases

### Check Button Text

```jsx
<ReadabilityChecker text="Click to Start" type="button" />
// ⚠️ Warning: Avoid using 'click' in button text
```

### Check Heading Text

```jsx
<ReadabilityChecker 
  text="Tournament Results" 
  type="heading" 
  headingLevel={1} 
/>
```

### Check Body Text

```jsx
<ReadabilityChecker 
  text="Your paragraph text here..." 
  type="body" 
  showDetails={true} 
/>
```

### Check Error Messages

```jsx
<ReadabilityChecker 
  text="An error occurred" 
  type="error" 
/>
```

## Programmatic Checking

```javascript
import { analyzeReadability } from '@/shared/utils/readabilityUtils';

const text = "Your text here...";
const analysis = analyzeReadability(text);

if (!analysis.isValid) {
  console.warn('Issues:', analysis.issues);
  console.log('Suggestions:', analysis.suggestions);
}

console.log('Reading level:', analysis.metrics.readingLevel);
```

## What Gets Checked?

- ✅ Sentence length (target: 12-18 words)
- ✅ Reading level (target: Grade 7-9)
- ✅ Passive voice usage
- ✅ Button/link text clarity
- ✅ Heading length

## Development Only

The `ReadabilityChecker` component automatically hides in production builds. Use it freely during development!

## Next Steps

- Read the [Content Style Guide](./content-style-guide.md) for writing guidelines
- See [Sample Rewrites](./sample-rewrites.md) for examples
- Check [Implementation Guide](./readability-implementation-guide.md) for advanced usage

---

**Questions?** See the full documentation in the `docs/` folder.
