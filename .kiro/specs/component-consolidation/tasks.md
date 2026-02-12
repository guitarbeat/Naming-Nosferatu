# Implementation Plan: Component Consolidation

## Overview

This plan breaks down the component consolidation into incremental, safe steps. Each step consolidates a specific set of components, updates imports, and verifies functionality before moving to the next step. The approach prioritizes safety through automated refactoring tools and comprehensive testing.

## Tasks

- [x] 1. Set up consolidation infrastructure
  - Create utility scripts for analyzing component dependencies
  - Set up import update automation using TypeScript compiler API
  - Configure test environment for consolidation verification
  - _Requirements: 7.1, 7.2_

- [ ]* 1.1 Write property test for import update consistency
  - **Property 1: Import Update Consistency**
  - **Validates: Requirements 1.1, 1.3, 2.4, 3.3, 7.1**

- [ ] 2. Identify and remove re-export wrappers
  - [-] 2.1 Scan codebase for re-export wrapper components
    - Create script to identify files that only contain re-exports
    - Generate list of wrapper files and their targets
    - _Requirements: 1.1_
  
  - [~] 2.2 Update imports for re-export wrappers
    - Use TypeScript language service to find all import references
    - Update imports to reference actual implementations
    - Remove wrapper files
    - _Requirements: 1.1, 1.3_
  
  - [ ]* 2.3 Write property test for wrapper removal
    - **Property 3: Wrapper Removal Completeness**
    - **Validates: Requirements 1.1, 1.2**
  
  - [~] 2.4 Verify no broken imports
    - Run TypeScript compiler to check for errors
    - Run test suite to verify functionality
    - _Requirements: 1.4, 7.3_

- [~] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Consolidate Calendar components
  - [~] 4.1 Create consolidated Calendar component
    - Merge Calendar.tsx and EmotionalCalendar.tsx functionality
    - Implement variant prop for 'default' and 'emotion-tracking' modes
    - Preserve forwardRef and imperative handle
    - Support all props from both original components
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 4.2 Write unit tests for Calendar consolidation
    - Test default variant renders correctly
    - Test emotion-tracking variant with emotion data
    - Test forwardRef and imperative handle methods
    - Test all prop combinations
    - _Requirements: 2.2, 2.3_
  
  - [ ]* 4.3 Write property test for functionality preservation
    - **Property 2: Functionality Preservation**
    - **Validates: Requirements 2.2, 3.4, 6.4**
  
  - [~] 4.4 Update all Calendar imports
    - Find all imports of Calendar and EmotionalCalendar
    - Update to use consolidated Calendar component
    - Add variant prop where needed
    - _Requirements: 2.4_
  
  - [~] 4.5 Remove old Calendar components
    - Delete Calendar.tsx and EmotionalCalendar.tsx
    - Verify no references remain
    - _Requirements: 2.1_

- [ ] 5. Consolidate Loading components
  - [~] 5.1 Create consolidated Loading component
    - Merge LoadingScreen and LoadingSpinner functionality
    - Implement variant prop for 'inline' and 'fullscreen' modes
    - Support size prop (sm, md, lg)
    - Support optional message prop
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [ ]* 5.2 Write unit tests for Loading consolidation
    - Test inline variant renders correctly
    - Test fullscreen variant with overlay
    - Test all size options
    - Test with and without message
    - _Requirements: 3.2, 3.4_
  
  - [ ]* 5.3 Write property test for variant support
    - **Property 4: Variant Support**
    - **Validates: Requirements 3.2**
  
  - [~] 5.4 Update all Loading imports
    - Find all imports of LoadingScreen and LoadingSpinner
    - Update to use consolidated Loading component
    - Add appropriate variant prop
    - _Requirements: 3.3_
  
  - [~] 5.5 Remove old Loading components
    - Delete LoadingScreen.tsx and LoadingSpinner.tsx
    - Verify no references remain
    - _Requirements: 3.1_

- [~] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Standardize UI components
  - [~] 7.1 Audit existing Button and Card implementations
    - Identify all Button and Card component files
    - Document which use shadcn/ui vs styled-components
    - List all props and features used
    - _Requirements: 4.1_
  
  - [~] 7.2 Choose shadcn/ui as standard
    - Verify shadcn/ui Button and Card are installed
    - Document decision in design.md
    - _Requirements: 4.1, 4.3_
  
  - [~] 7.3 Create compatibility wrappers
    - Create LegacyButton wrapper that maps old props to shadcn/ui
    - Create LegacyCard wrapper that maps old props to shadcn/ui
    - Add deprecation notices in JSDoc
    - _Requirements: 4.2_
  
  - [ ]* 7.4 Write property test for compatibility wrappers
    - **Property 5: Compatibility Wrapper Correctness**
    - **Validates: Requirements 4.2**
  
  - [ ]* 7.5 Write unit tests for compatibility wrappers
    - Test prop mapping for common use cases
    - Test edge cases and default values
    - _Requirements: 4.2_
  
  - [~] 7.6 Update imports to use shadcn/ui components
    - Find all Button and Card imports
    - Update to use shadcn/ui versions
    - Use compatibility wrappers where immediate migration is complex
    - _Requirements: 4.1_

- [ ] 8. Consolidate Emotion Tracking components
  - [~] 8.1 Create EmotionTracker component
    - Implement core emotion logging functionality
    - Support emotion selector UI
    - Support quick log functionality
    - Add compact mode prop
    - _Requirements: 5.1, 5.2_
  
  - [~] 8.2 Create EmotionAnalytics component
    - Implement emotion insights and patterns
    - Support trend visualization
    - Support statistics display
    - Support date range filtering
    - _Requirements: 5.1, 5.3_
  
  - [~] 8.3 Update EmotionTrackingDashboard
    - Use new EmotionTracker component
    - Use new EmotionAnalytics component
    - Remove duplicate styled components
    - _Requirements: 5.4, 5.5_
  
  - [ ]* 8.4 Write property test for duplication elimination
    - **Property 6: Duplication Elimination**
    - **Validates: Requirements 5.5**
  
  - [ ]* 8.5 Write unit tests for emotion components
    - Test EmotionTracker logging functionality
    - Test EmotionAnalytics insights and trends
    - Test EmotionTrackingDashboard orchestration
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [~] 8.6 Update emotion tracking imports
    - Find all imports of old emotion components
    - Update to use new consolidated components
    - _Requirements: 5.1_
  
  - [~] 8.7 Remove old emotion tracking components
    - Delete duplicate emotion component files
    - Verify no references remain
    - _Requirements: 5.1, 5.5_

- [~] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Consolidate N8N Integration components
  - [~] 10.1 Extract shared Alert component
    - Create reusable Alert component
    - Support variant prop (info, warning, error, success)
    - Support message and optional action props
    - _Requirements: 6.2_
  
  - [~] 10.2 Extract shared StatusIndicator component
    - Create reusable StatusIndicator component
    - Support status prop (idle, loading, success, error)
    - Support optional label prop
    - _Requirements: 6.2_
  
  - [~] 10.3 Create consolidated N8NIntegration component
    - Merge N8NDataExport and N8NWorkflowManager functionality
    - Implement mode prop ('export', 'workflow', 'both')
    - Support workflowId prop for workflow mode
    - Use shared Alert and StatusIndicator components
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ]* 10.4 Write unit tests for N8N components
    - Test Alert component variants
    - Test StatusIndicator component states
    - Test N8NIntegration in all modes
    - Test export and workflow functionality
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [~] 10.5 Update N8N imports
    - Find all imports of N8NDataExport and N8NWorkflowManager
    - Update to use consolidated N8NIntegration component
    - Add appropriate mode prop
    - _Requirements: 6.1_
  
  - [~] 10.6 Remove old N8N components
    - Delete N8NDataExport.tsx and N8NWorkflowManager.tsx
    - Verify no references remain
    - _Requirements: 6.1, 6.3_

- [ ] 11. Update test files and mocks
  - [~] 11.1 Update test imports
    - Find all test files importing consolidated components
    - Update imports to reference new component locations
    - _Requirements: 8.1_
  
  - [~] 11.2 Update component mocks
    - Update mock files to reference consolidated components
    - Update mock implementations for new component APIs
    - _Requirements: 8.4_
  
  - [ ]* 11.3 Write property test for test file synchronization
    - **Property 7: Test File Synchronization**
    - **Validates: Requirements 8.1, 8.4**
  
  - [~] 11.4 Verify test coverage
    - Run test coverage report
    - Compare with baseline coverage
    - Ensure coverage is maintained or improved
    - _Requirements: 8.3_

- [ ] 12. Final verification and cleanup
  - [~] 12.1 Run full build
    - Execute build command
    - Verify no compilation errors
    - Check bundle size
    - _Requirements: 7.4_
  
  - [~] 12.2 Run full test suite
    - Execute all tests
    - Verify all tests pass
    - Check for any warnings
    - _Requirements: 8.2_
  
  - [~] 12.3 Verify no broken imports
    - Run TypeScript compiler with strict checks
    - Use ESLint to check for unused imports
    - Verify no module resolution errors
    - _Requirements: 7.3_
  
  - [~] 12.4 Clean up unused files
    - Remove any remaining old component files
    - Remove unused styled components
    - Update component index files
    - _Requirements: 1.2, 5.5_
  
  - [~] 12.5 Update documentation
    - Document the new component structure
    - Create migration guide for deprecated components
    - Update component usage examples
    - _Requirements: 4.3, 4.4_

- [~] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster consolidation
- Each consolidation step is independent and can be done incrementally
- Checkpoints ensure verification at reasonable intervals
- Property tests validate universal correctness properties across all consolidations
- Unit tests validate specific consolidation examples and edge cases
- Use TypeScript compiler API and language service for automated refactoring
- Keep old files until all imports are verified to allow rollback if needed
