# Requirements Document: Component Consolidation

## Introduction
The src/components directory contains significant duplication with 40+ component files including duplicate implementations, overlapping functionality, and inconsistent patterns. This consolidation will reduce technical debt, improve maintainability, and establish clear component conventions.

## Glossary
- **Component_Duplication**: Multiple components implementing the same or similar functionality
- **Re-export_Wrapper**: A file that only re-exports from another file without adding value
- **Thin_Wrapper**: A component that adds minimal functionality over another component
- **Parallel_Implementation**: Two different implementations of the same UI component (e.g., styled-components vs shadcn/ui)

## Requirements

### Requirement 1: Remove Unnecessary Wrappers
**User Story:** As a developer, I want to remove re-export wrappers and thin wrapper components, so that the codebase is simpler and import paths are clearer.

#### Acceptance Criteria
1. WHEN a component is just a re-export, THE system SHALL remove it and update all imports
2. WHEN a component is a thin wrapper adding no value, THE system SHALL remove it
3. THE system SHALL update all import statements to reference the actual implementation
4. THE system SHALL verify no broken imports remain after removal

### Requirement 2: Consolidate Calendar Components
**User Story:** As a developer, I want a single calendar implementation, so that calendar functionality is consistent and maintainable.

#### Acceptance Criteria
1. WHEN multiple calendar components exist, THE system SHALL merge them into one
2. THE system SHALL preserve all functionality from both Calendar.tsx and EmotionalCalendar.tsx
3. THE system SHALL maintain the forwardRef and imperative handle from EmotionalCalendar
4. THE system SHALL update all imports to use the consolidated component

### Requirement 3: Consolidate Loading Components
**User Story:** As a developer, I want a single loading component with variants, so that loading states are consistent across the app.

#### Acceptance Criteria
1. WHEN LoadingScreen and LoadingSpinner exist, THE system SHALL merge them
2. THE merged component SHALL support both inline and fullscreen variants via props
3. THE system SHALL update all imports to use the consolidated component
4. THE system SHALL maintain all existing loading functionality

### Requirement 4: Standardize UI Components
**User Story:** As a developer, I want a single implementation for base UI components, so that styling is consistent and maintainable.

#### Acceptance Criteria
1. WHEN parallel implementations exist (Button, Card), THE system SHALL choose one standard
2. THE system SHALL create compatibility wrappers for gradual migration
3. THE system SHALL document the chosen standard (shadcn/ui vs styled-components)
4. THE system SHALL provide migration guide for deprecated components

### Requirement 5: Consolidate Emotion Tracking Components
**User Story:** As a developer, I want consolidated emotion tracking components, so that emotion functionality is not duplicated across multiple files.

#### Acceptance Criteria
1. WHEN multiple emotion trackers exist, THE system SHALL consolidate to 2 core components
2. THE system SHALL create EmotionTracker for core logging functionality
3. THE system SHALL create EmotionAnalytics for insights and patterns
4. THE system SHALL keep EmotionTrackingDashboard as orchestrator
5. THE system SHALL eliminate duplicate styled components and logic

### Requirement 6: Consolidate N8N Components
**User Story:** As a developer, I want consolidated N8N integration components, so that N8N functionality is organized and maintainable.

#### Acceptance Criteria
1. WHEN multiple N8N components exist, THE system SHALL consolidate to 3 components
2. THE system SHALL extract shared Alert and Status components
3. THE system SHALL merge N8NDataExport and N8NWorkflowManager into N8NIntegration
4. THE system SHALL maintain all existing N8N functionality

### Requirement 7: Update All References
**User Story:** As a developer, I want all imports automatically updated, so that the application continues to work after consolidation.

#### Acceptance Criteria
1. WHEN components are moved or merged, THE system SHALL update all import statements
2. THE system SHALL use semantic rename tools where possible
3. THE system SHALL verify no broken imports remain
4. THE system SHALL run build and tests to verify functionality

### Requirement 8: Maintain Test Coverage
**User Story:** As a developer, I want test coverage maintained, so that consolidation doesn't break existing functionality.

#### Acceptance Criteria
1. WHEN components are consolidated, THE system SHALL update or merge test files
2. THE system SHALL ensure all tests pass after consolidation
3. THE system SHALL maintain or improve test coverage percentage
4. THE system SHALL update test mocks for consolidated components
