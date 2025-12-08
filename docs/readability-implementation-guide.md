# Readability Implementation Guide

This guide explains how to use the readability tools and components in your React application.

---

## Quick Start

### 1. Import the Utilities

```javascript
import {
  analyzeReadability,
  validateButtonText,
  validateHeadingText,
  countWords,
  averageWordsPerSentence,
} from '@/shared/utils/readabilityUtils';
```

### 2. Use the ReadabilityChecker Component

```jsx
import ReadabilityChecker from '@/shared/components/ReadabilityChecker';

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

---

## Usage Examples

### Checking Button Text

```jsx
import ReadabilityChecker from '@/shared/components/ReadabilityChecker';

function SubmitButton() {
  const buttonText = "Click to Start Tournament";
  
  return (
    <>
      <button>{buttonText}</button>
      {/* Shows warning: "Avoid using 'click' in button text" */}
      <ReadabilityChecker text={buttonText} type="button" />
    </>
  );
}
```

### Checking Heading Text

```jsx
import ReadabilityChecker from '@/shared/components/ReadabilityChecker';

function PageHeader() {
  const headingText = "Tournament Results and Rankings Display";
  
  return (
    <>
      <h1>{headingText}</h1>
      {/* Shows warning: "Heading is too long" */}
      <ReadabilityChecker text={headingText} type="heading" headingLevel={1} />
    </>
  );
}
```

### Checking Body Text

```jsx
import ReadabilityChecker from '@/shared/components/ReadabilityChecker';

function WelcomeMessage() {
  const welcomeText = "A scientifically-driven tournament platform that helps you discover the perfect cat name using the same Elo rating algorithm that ranks chess grandmasters.";
  
  return (
    <>
      <p>{welcomeText}</p>
      {/* Shows: Reading level, sentence length, suggestions */}
      <ReadabilityChecker text={welcomeText} type="body" showDetails={true} />
    </>
  );
}
```

### Programmatic Analysis

```javascript
import { analyzeReadability } from '@/shared/utils/readabilityUtils';

const text = "Your long text here...";
const analysis = analyzeReadability(text);

if (!analysis.isValid) {
  console.warn('Readability issues found:', analysis.issues);
  console.log('Suggestions:', analysis.suggestions);
}

console.log('Metrics:', analysis.metrics);
// {
//   wordCount: 45,
//   sentenceCount: 3,
//   avgWordsPerSentence: 15.0,
//   readingLevel: 8.5,
//   hasPassiveVoice: false
// }
```

---

## API Reference

### `analyzeReadability(text, options)`

Analyzes text for readability issues.

**Parameters**:
- `text` (string): Text to analyze
- `options` (object, optional):
  - `maxSentenceLength` (number): Max words per sentence (default: 20)
  - `targetAvgWords` (number): Target avg words per sentence (default: 15)
  - `maxReadingLevel` (number): Max reading level (default: 9)

**Returns**:
```javascript
{
  isValid: boolean,
  issues: Array<{
    type: string,
    severity: 'low' | 'medium' | 'high',
    message: string,
    suggestion: string
  }>,
  suggestions: string[],
  metrics: {
    wordCount: number,
    sentenceCount: number,
    avgWordsPerSentence: number,
    readingLevel: number,
    hasPassiveVoice: boolean
  }
}
```

### `validateButtonText(text)`

Validates button text for clarity and accessibility.

**Parameters**:
- `text` (string): Button text to validate

**Returns**:
```javascript
{
  isValid: boolean,
  issues: string[],
  suggestions: string[],
  wordCount: number
}
```

### `validateHeadingText(text, level)`

Validates heading text for clarity and SEO.

**Parameters**:
- `text` (string): Heading text to validate
- `level` (number): Heading level 1-6 (default: 2)

**Returns**:
```javascript
{
  isValid: boolean,
  issues: string[],
  suggestions: string[],
  wordCount: number
}
```

### `countWords(text)`

Counts words in text.

**Parameters**:
- `text` (string): Text to analyze

**Returns**: `number` - Word count

### `averageWordsPerSentence(text)`

Calculates average words per sentence.

**Parameters**:
- `text` (string): Text to analyze

**Returns**: `number` - Average words per sentence

---

## ReadabilityChecker Component

### Props

| Prop           | Type                                       | Default | Description                                 |
| -------------- | ------------------------------------------ | ------- | ------------------------------------------- |
| `text`         | string                                     | -       | Text to analyze                             |
| `type`         | 'button' \| 'heading' \| 'body' \| 'error' | 'body'  | Type of content                             |
| `headingLevel` | number                                     | 2       | Heading level (1-6) if type is 'heading'    |
| `showDetails`  | boolean                                    | false   | Whether to show detailed analysis initially |

### Behavior

- **Only renders in development mode** (`process.env.NODE_ENV === 'development'`)
- Shows ✅ for valid text, ⚠️ for issues
- Expandable details panel with metrics and suggestions
- Color-coded: green for valid, yellow for issues

---

## Integration Examples

### In Form Components

```jsx
import ReadabilityChecker from '@/shared/components/ReadabilityChecker';

function LoginForm() {
  const [welcomeText, setWelcomeText] = useState("Ready to Judge the Names?");
  
  return (
    <div>
      <input
        value={welcomeText}
        onChange={(e) => setWelcomeText(e.target.value)}
      />
      <ReadabilityChecker text={welcomeText} type="heading" headingLevel={1} />
    </div>
  );
}
```

### In Content Management

```jsx
import { analyzeReadability } from '@/shared/utils/readabilityUtils';

function ContentEditor({ content, onSave }) {
  const analysis = analyzeReadability(content);
  
  const handleSave = () => {
    if (!analysis.isValid) {
      if (!confirm('Content has readability issues. Save anyway?')) {
        return;
      }
    }
    onSave(content);
  };
  
  return (
    <div>
      <textarea value={content} onChange={...} />
      {analysis.issues.length > 0 && (
        <div className="warnings">
          {analysis.issues.map((issue, i) => (
            <div key={i}>{issue.message}</div>
          ))}
        </div>
      )}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### In CI/CD Pipeline

```javascript
// scripts/check-readability.js
import { analyzeReadability } from './src/shared/utils/readabilityUtils';
import fs from 'fs';

const contentFiles = [
  'src/features/auth/Login.jsx',
  'src/features/tournament/Results.jsx',
  // ... other files
];

let hasErrors = false;

contentFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Extract user-facing strings (simplified example)
  const userFacingText = extractUserFacingText(content);
  
  userFacingText.forEach(text => {
    const analysis = analyzeReadability(text);
    if (!analysis.isValid) {
      console.error(`Readability issues in ${file}:`, analysis.issues);
      hasErrors = true;
    }
  });
});

if (hasErrors) {
  process.exit(1);
}
```

---

## Best Practices

### 1. Use in Development Only

The `ReadabilityChecker` component automatically hides in production. Use it during development to catch issues early.

### 2. Check Critical Content

Prioritize checking:
- Error messages
- Button labels
- Form instructions
- Page headings
- Feature descriptions

### 3. Don't Over-Optimize

Readability tools are guides, not strict rules. Sometimes longer sentences or technical terms are appropriate. Use your judgment.

### 4. Test with Real Users

Readability scores are helpful, but real user testing is the best validation. Use tools to catch obvious issues, then test with users.

### 5. Iterate Based on Feedback

If users find content confusing despite good readability scores, simplify further. User feedback trumps metrics.

---

## Troubleshooting

### ReadabilityChecker Not Showing

- Check that `process.env.NODE_ENV === 'development'`
- Verify `text` prop is provided and not empty
- Check browser console for errors

### False Positives

- Some technical terms may trigger warnings
- Long but necessary sentences may flag as issues
- Use your judgment - tools are guides, not rules

### Performance

- Readability analysis runs on every render
- For large texts, consider memoizing the analysis
- Use `useMemo` for expensive calculations

---

## Next Steps

1. ✅ Add `ReadabilityChecker` to key components
2. ⏳ Run analysis on existing content
3. ⏳ Apply improvements based on suggestions
4. ⏳ Set up CI/CD checks (optional)
5. ⏳ Train team on using the tools

---

**Last Updated**: December 2025  
**Questions?**: See `docs/readability-analysis.md` for detailed guidelines
