# Design Document: Component Consolidation

## Overview

This design outlines a systematic approach to consolidating duplicate and overlapping components in the codebase. The consolidation will reduce the component count from 40+ files to a more maintainable set while preserving all functionality. The approach prioritizes safety through incremental changes, automated refactoring tools, and comprehensive testing at each step.

The consolidation follows a phased approach:
1. Remove simple re-export wrappers and thin wrappers
2. Consolidate duplicate implementations into single components with variants
3. Standardize on a single UI component library (shadcn/ui)
4. Update all imports and references automatically
5. Verify functionality through existing tests

## Architecture

### Consolidation Strategy

The consolidation follows a **bottom-up, incremental approach**:

1. **Identification Phase**: Analyze components to categorize them as:
   - Re-export wrappers (remove entirely)
   - Thin wrappers (remove and redirect imports)
   - Duplicate implementations (merge into one)
   - Parallel implementations (choose standard, create compatibility layer)
   - Unique components (keep as-is)

2. **Consolidation Phase**: For each category:
   - Create consolidated component with all required functionality
   - Use variant props to support different use cases
   - Maintain backward compatibility where needed
   - Update imports using automated tools

3. **Verification Phase**: After each consolidation:
   - Run type checking
   - Run existing tests
   - Verify no broken imports
   - Check for unused files

### Component Organization

Post-consolidation, components will follow this structure:

```
src/shared/components/
├── ui/                    # Base UI components (shadcn/ui standard)
│   ├── Button/
│   ├── Card/
│   ├── Calendar/
│   └── Loading/
├── features/              # Feature-specific components
│   ├── EmotionTracking/
│   └── N8NIntegration/
└── layout/                # Layout components
    ├── AppNavbar/
    └── Header/
```

## Components and Interfaces

### 1. Wrapper Removal Strategy

**Re-export Wrappers**: Components that only re-export from another file

```typescript
// BEFORE: Button/index.ts (re-export wrapper)
export { Button } from './Button';

// AFTER: Remove index.ts, update imports to reference Button.tsx directly
```

**Thin Wrappers**: Components that add minimal value

```typescript
// BEFORE: LoadingWrapper.tsx
export const LoadingWrapper = ({ loading, children }) => 
  loading ? <LoadingSpinner /> : children;

// AFTER: Remove wrapper, use LoadingSpinner directly with conditional rendering
```

### 2. Calendar Consolidation

**Current State**:
- `Calendar.tsx`: Basic calendar component
- `EmotionalCalendar.tsx`: Calendar with emotion tracking features

**Consolidated Design**:

```typescript
interface CalendarProps {
  // Base calendar props
  selected?: Date;
  onSelect?: (date: Date) => void;
  
  // Emotion tracking variant
  variant?: 'default' | 'emotion-tracking';
  emotionData?: Map<string, EmotionEntry>;
  onEmotionClick?: (date: Date, emotion: EmotionEntry) => void;
  
  // Imperative handle support
  ref?: React.Ref<CalendarHandle>;
}

interface CalendarHandle {
  scrollToDate: (date: Date) => void;
  highlightDate: (date: Date) => void;
}

// Single consolidated component
export const Calendar = React.forwardRef<CalendarHandle, CalendarProps>(
  ({ variant = 'default', emotionData, ...props }, ref) => {
    // Implementation combines both calendars
    // Uses variant prop to determine rendering mode
  }
);
```

**Migration Strategy**:
- Keep both files initially
- Create new consolidated Calendar component
- Update imports gradually
- Remove old files once all imports updated

### 3. Loading Component Consolidation

**Current State**:
- `LoadingScreen.tsx`: Full-screen loading overlay
- `LoadingSpinner.tsx`: Inline spinner component

**Consolidated Design**:

```typescript
interface LoadingProps {
  variant?: 'inline' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  variant = 'inline',
  size = 'md',
  message,
  className
}) => {
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80">
        <Spinner size={size} />
        {message && <p className="mt-4">{message}</p>}
      </div>
    );
  }
  
  return <Spinner size={size} className={className} />;
};
```

### 4. UI Component Standardization

**Decision**: Standardize on **shadcn/ui** as the base UI library

**Rationale**:
- Already integrated in the project
- Provides accessible, customizable components
- Uses Radix UI primitives (high quality)
- Tailwind-based styling (consistent with project)

**Components to Standardize**:
- Button: Use shadcn/ui Button
- Card: Use shadcn/ui Card
- Input: Use shadcn/ui Input
- Dialog: Use shadcn/ui Dialog

**Migration Strategy**:

```typescript
// Create compatibility wrapper for gradual migration
// src/shared/components/ui/Button/LegacyButton.tsx
import { Button as ShadcnButton } from '@/components/ui/button';

export const LegacyButton = (props: LegacyButtonProps) => {
  // Map old props to new shadcn/ui props
  const mappedProps = mapLegacyProps(props);
  return <ShadcnButton {...mappedProps} />;
};

// Deprecation notice in JSDoc
/**
 * @deprecated Use Button from '@/components/ui/button' instead
 * This wrapper will be removed in v2.0
 */
```

### 5. Emotion Tracking Consolidation

**Current State** (assumed based on requirements):
- Multiple emotion tracking components with overlapping functionality
- Duplicate styled components
- Scattered emotion logic

**Consolidated Design**:

```typescript
// Core emotion tracking component
interface EmotionTrackerProps {
  onEmotionLog: (emotion: Emotion) => void;
  currentMood?: Emotion;
  compact?: boolean;
}

export const EmotionTracker: React.FC<EmotionTrackerProps> = ({
  onEmotionLog,
  currentMood,
  compact = false
}) => {
  // Core emotion logging UI
  // Emotion selector
  // Quick log functionality
};

// Analytics and insights component
interface EmotionAnalyticsProps {
  emotions: Emotion[];
  dateRange?: { start: Date; end: Date };
  showTrends?: boolean;
}

export const EmotionAnalytics: React.FC<EmotionAnalyticsProps> = ({
  emotions,
  dateRange,
  showTrends = true
}) => {
  // Emotion patterns and insights
  // Trend visualization
  // Statistics
};

// Dashboard orchestrator
export const EmotionTrackingDashboard: React.FC = () => {
  return (
    <div>
      <EmotionTracker onEmotionLog={handleLog} />
      <EmotionAnalytics emotions={emotions} />
    </div>
  );
};
```

### 6. N8N Integration Consolidation

**Current State** (assumed):
- Multiple N8N-related components
- Duplicate Alert and Status components
- Separate export and workflow management

**Consolidated Design**:

```typescript
// Extract shared components
export const Alert: React.FC<AlertProps> = ({ variant, message }) => {
  // Reusable alert component
};

export const StatusIndicator: React.FC<StatusProps> = ({ status }) => {
  // Reusable status indicator
};

// Consolidated N8N integration component
interface N8NIntegrationProps {
  mode: 'export' | 'workflow' | 'both';
  workflowId?: string;
}

export const N8NIntegration: React.FC<N8NIntegrationProps> = ({
  mode,
  workflowId
}) => {
  return (
    <div>
      {(mode === 'export' || mode === 'both') && <DataExportPanel />}
      {(mode === 'workflow' || mode === 'both') && (
        <WorkflowManager workflowId={workflowId} />
      )}
    </div>
  );
};
```

## Data Models

### Component Metadata

```typescript
interface ComponentMetadata {
  name: string;
  path: string;
  type: 'wrapper' | 'duplicate' | 'unique' | 'parallel';
  dependencies: string[];
  usedBy: string[];
  consolidationTarget?: string;
}
```

### Consolidation Plan

```typescript
interface ConsolidationStep {
  id: string;
  type: 'remove' | 'merge' | 'standardize';
  sourceComponents: string[];
  targetComponent: string;
  importUpdates: ImportUpdate[];
  testUpdates: string[];
}

interface ImportUpdate {
  file: string;
  oldImport: string;
  newImport: string;
}
```

### Migration Status

```typescript
interface MigrationStatus {
  step: string;
  status: 'pending' | 'in-progress' | 'complete' | 'failed';
  componentsAffected: string[];
  testsUpdated: number;
  importsUpdated: number;
  errors?: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Import Update Consistency
*For any* component consolidation (removal, merge, or standardization), all import statements in the codebase should be updated to reference the new component location, and no imports should reference removed or moved files.
**Validates: Requirements 1.1, 1.3, 2.4, 3.3, 7.1**

### Property 2: Functionality Preservation
*For any* consolidated component, all props, methods, and behaviors from the source components should be available in the consolidated component, either directly or through variant props.
**Validates: Requirements 2.2, 3.4, 6.4**

### Property 3: Wrapper Removal Completeness
*For any* component identified as a re-export wrapper or thin wrapper, after consolidation the wrapper file should not exist and all imports should reference the actual implementation.
**Validates: Requirements 1.1, 1.2**

### Property 4: Variant Support
*For any* consolidated component that merges multiple implementations, the component should accept a variant prop that enables all original use cases.
**Validates: Requirements 3.2**

### Property 5: Compatibility Wrapper Correctness
*For any* deprecated component with a compatibility wrapper, the wrapper should correctly map all old props to new props and produce equivalent output to the original component.
**Validates: Requirements 4.2**

### Property 6: Duplication Elimination
*For any* set of duplicate styled components or logic, after consolidation only one implementation should exist and be referenced by all consumers.
**Validates: Requirements 5.5**

### Property 7: Test File Synchronization
*For any* consolidated component, test files and mocks should be updated to reference the consolidated component and all test imports should resolve correctly.
**Validates: Requirements 8.1, 8.4**

## Error Handling

### Import Resolution Errors

**Error Type**: Broken imports after consolidation

**Detection**:
- Run TypeScript compiler (`tsc --noEmit`)
- Check for module resolution errors
- Use ESLint to detect unused imports

**Handling**:
- Automated: Use TypeScript language server to find all references
- Manual fallback: Search codebase for import patterns
- Rollback: Keep old files until all imports verified

### Component API Mismatches

**Error Type**: Props or methods missing in consolidated component

**Detection**:
- TypeScript type checking
- Runtime prop validation in development
- Unit tests for component APIs

**Handling**:
- Add missing props to consolidated component
- Create compatibility layer for deprecated props
- Document breaking changes

### Test Failures

**Error Type**: Tests fail after consolidation

**Detection**:
- Run full test suite after each consolidation step
- Check for import errors in test files
- Verify mock updates

**Handling**:
- Update test imports
- Update component mocks
- Fix test assertions for new component APIs
- Add new tests for variant props

### Build Failures

**Error Type**: Build process fails after consolidation

**Detection**:
- Run build command (`npm run build` or `vite build`)
- Check for compilation errors
- Verify bundle size and dependencies

**Handling**:
- Fix import errors
- Update build configuration if needed
- Verify tree-shaking works correctly
- Check for circular dependencies

## Testing Strategy

### Dual Testing Approach

This consolidation will use both unit tests and property-based tests to ensure correctness:

- **Unit tests**: Verify specific consolidation steps, component examples, and edge cases
- **Property tests**: Verify universal properties across all consolidations

Together, these provide comprehensive coverage where unit tests catch concrete bugs in specific consolidations and property tests verify general correctness across all refactoring operations.

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) to implement property-based tests. Each test will run a minimum of 100 iterations to ensure comprehensive coverage through randomization.

Each property test will be tagged with a comment referencing the design document property:

```typescript
// Feature: component-consolidation, Property 1: Import Update Consistency
test('all imports updated after consolidation', () => {
  fc.assert(
    fc.property(
      fc.record({
        sourceComponent: fc.string(),
        targetComponent: fc.string(),
        importingFiles: fc.array(fc.string())
      }),
      ({ sourceComponent, targetComponent, importingFiles }) => {
        // Test that consolidation updates all imports
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

Unit tests will focus on:

1. **Specific Consolidation Examples**:
   - Calendar consolidation preserves forwardRef
   - Loading component supports both variants
   - N8N components merge correctly

2. **Edge Cases**:
   - Components with no imports
   - Components imported with aliases
   - Dynamic imports
   - Re-exported components

3. **Integration Points**:
   - Build process completes successfully
   - Test suite passes
   - TypeScript compilation succeeds

### Test Coverage Requirements

- Maintain or improve current test coverage percentage
- Each consolidated component must have tests for all variants
- Compatibility wrappers must have tests verifying prop mapping
- Integration tests must verify end-to-end functionality

### Testing Workflow

For each consolidation step:

1. **Pre-consolidation**: Run tests and record coverage baseline
2. **During consolidation**: Update tests incrementally
3. **Post-consolidation**: Verify all tests pass and coverage maintained
4. **Verification**: Run full build and test suite

### Manual Testing Checklist

After automated tests pass:

- [ ] Visual inspection of consolidated components in UI
- [ ] Verify no console errors or warnings
- [ ] Check that all component variants render correctly
- [ ] Verify accessibility features still work
- [ ] Test in different browsers if applicable
