# Implementation Plan: Reference File Integration System

## Overview

This implementation plan breaks down the reference file integration system into discrete, testable tasks. The approach follows a bottom-up strategy, building core utilities first, then the analysis and integration engines, and finally the orchestration layer. Each task includes property-based tests to validate correctness properties from the design document.

## Tasks

- [x] 1. Set up project structure and core types
  - Create src/services/integration/ directory for integration system
  - Define TypeScript interfaces and types from design document (FileAnalysis, DependencyGraph, IntegrationResult, etc.)
  - Set up fast-check library for property-based testing
  - _Requirements: All requirements (foundational)_

- [ ] 2. Implement File Analyzer
  - [x] 2.1 Create AST parser for TypeScript files
    - Use TypeScript Compiler API to parse files
    - Extract imports, exports, and file structure
    - _Requirements: 1.2_
  
  - [ ]* 2.2 Write property test for import extraction
    - **Property 2: Import Extraction Completeness**
    - **Validates: Requirements 1.2**
  
  - [x] 2.3 Implement file type classifier
    - Detect React components (JSX/TSX with component exports)
    - Detect custom hooks (files starting with "use")
    - Detect services, utilities, and type definitions
    - _Requirements: 1.1_
  
  - [ ]* 2.4 Write property test for file type classification
    - **Property 1: File Type Classification**
    - **Validates: Requirements 1.1**
  
  - [x] 2.5 Implement target location resolver
    - Map file types to target directories
    - Handle special cases (layout vs features for components)
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 2.6 Write property test for target location mapping
    - **Property 3: File Type to Target Location Mapping**
    - **Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4, 2.5**
  
  - [x] 2.7 Implement dependency resolver
    - Check if imports exist in project
    - Classify as external vs internal
    - _Requirements: 1.4, 4.4, 7.1_
  
  - [ ]* 2.8 Write property test for dependency resolution
    - **Property 4: Dependency Resolution Status**
    - **Validates: Requirements 1.4, 4.4**
  
  - [ ]* 2.9 Write property test for dependency classification
    - **Property 11: Dependency Classification**
    - **Validates: Requirements 7.1**

- [x] 3. Checkpoint - Ensure file analyzer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Dependency Graph Builder
  - [x] 4.1 Create dependency graph data structure
    - Build graph from file analyses
    - Track nodes and edges
    - _Requirements: 8.1_
  
  - [x] 4.2 Implement topological sort
    - Sort files by dependencies
    - Handle independent files alphabetically
    - _Requirements: 7.4, 8.2, 8.4_
  
  - [ ]* 4.3 Write property test for dependency ordering
    - **Property 12: Dependency-Aware Integration Order**
    - **Validates: Requirements 7.4, 8.2**
  
  - [ ]* 4.4 Write property test for alphabetical ordering
    - **Property 13: Independent File Alphabetical Ordering**
    - **Validates: Requirements 8.4**
  
  - [x] 4.5 Implement circular dependency detection
    - Detect cycles in dependency graph
    - Report circular dependencies to user
    - _Requirements: 8.3_
  
  - [ ]* 4.6 Write unit test for circular dependency detection
    - Test with known circular dependency examples
    - _Requirements: 8.3_

- [ ] 5. Implement File Manager
  - [x] 5.1 Create backup system
    - Create timestamped backups before modifications
    - Track backup locations
    - _Requirements: 10.1_
  
  - [ ]* 5.2 Write property test for backup round-trip
    - **Property 15: Rollback Round-Trip**
    - **Validates: Requirements 10.1, 10.2**
  
  - [x] 5.3 Implement file operations
    - Read, write, delete files safely
    - Handle file system errors gracefully
    - _Requirements: 3.5, 6.1_
  
  - [x] 5.4 Implement import path updater
    - Transform relative paths based on new location
    - Update cross-references to target locations
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 5.5 Write property test for import path transformation
    - **Property 8: Import Path Transformation**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [x] 5.6 Implement rollback mechanism
    - Restore files from backups
    - Restore deleted reference files
    - _Requirements: 10.2, 10.3_
  
  - [ ]* 5.7 Write property test for reference file restoration
    - **Property 16: Reference File Restoration on Rollback**
    - **Validates: Requirements 10.3**

- [x] 6. Checkpoint - Ensure file manager tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Integration Engine
  - [x] 7.1 Create file comparison utility
    - Compare reference and existing files
    - Identify differences and conflicts
    - _Requirements: 3.1_
  
  - [x] 7.2 Implement merge logic
    - Preserve existing exports
    - Add non-conflicting new exports
    - Detect conflicts
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ]* 7.3 Write property test for existing functionality preservation
    - **Property 5: Existing Functionality Preservation**
    - **Validates: Requirements 3.2**
  
  - [ ]* 7.4 Write property test for non-conflicting export addition
    - **Property 6: Non-Conflicting Export Addition**
    - **Validates: Requirements 3.3**
  
  - [ ]* 7.5 Write unit test for conflict detection
    - Test with known conflict scenarios
    - _Requirements: 3.4_
  
  - [x] 7.6 Implement new file creation
    - Create files when no existing file exists
    - Set up proper directory structure
    - _Requirements: 3.5_
  
  - [ ]* 7.7 Write property test for new file creation
    - **Property 7: New File Creation**
    - **Validates: Requirements 3.5**
  
  - [x] 7.8 Implement integration result tracking
    - Track success, failures, and actions taken
    - Record conflicts for user review
    - _Requirements: 9.2_

- [ ] 8. Implement Build Verifier
  - [x] 8.1 Create TypeScript build runner
    - Execute tsc to check for errors
    - Parse and categorize build errors
    - _Requirements: 5.1_
  
  - [x] 8.2 Implement error diagnostics
    - Analyze common error patterns
    - Suggest fixes for known issues
    - _Requirements: 5.2_
  
  - [ ]* 8.3 Write unit tests for build verification
    - Test with files that cause known build errors
    - Test with files that build successfully
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Checkpoint - Ensure integration engine and build verifier tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Integration Orchestrator
  - [x] 10.1 Create integration state manager
    - Track progress across all files
    - Persist state for resume capability
    - _Requirements: 9.1, 9.3_
  
  - [ ]* 10.2 Write property test for state persistence
    - **Property 14: State Persistence and Resume**
    - **Validates: Requirements 9.3, 9.4**
  
  - [x] 10.3 Implement main integration workflow
    - Analyze all files
    - Build dependency graph
    - Process files in order
    - Verify builds after each integration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.4, 8.2_
  
  - [x] 10.4 Implement conditional file deletion
    - Delete only after successful integration and verification
    - Preserve files when awaiting user input
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 10.5 Write property test for conditional deletion
    - **Property 9: Conditional File Deletion**
    - **Validates: Requirements 6.1, 6.2, 6.3**
  
  - [x] 10.6 Implement directory cleanup
    - Remove once-integrated-delete when all files processed
    - _Requirements: 6.4_
  
  - [ ]* 10.7 Write property test for directory cleanup
    - **Property 10: Directory Cleanup**
    - **Validates: Requirements 6.4**
  
  - [ ] 10.8 Implement error recovery
    - Handle errors based on recovery strategy
    - Trigger rollback when necessary
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 11. Create CLI interface
  - [ ] 11.1 Implement command-line interface
    - Accept configuration options
    - Display progress and status
    - Handle user input for conflicts
    - _Requirements: 3.4, 5.3, 7.2, 7.5, 8.3_
  
  - [ ] 11.2 Add dry-run mode
    - Preview changes without executing
    - Show what would be integrated
    - _Requirements: All requirements (preview mode)_
  
  - [ ]* 11.3 Write integration tests for CLI
    - Test complete integration workflows
    - Test error scenarios and rollback
    - _Requirements: All requirements_

- [ ] 12. Final checkpoint - End-to-end integration test
  - Run complete integration on the actual once-integrated-delete directory
  - Verify all 10 files are correctly integrated
  - Ensure build passes after integration
  - Verify files are deleted and directory is cleaned up
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- The implementation uses TypeScript with the TypeScript Compiler API for AST parsing
- fast-check library is used for property-based testing
