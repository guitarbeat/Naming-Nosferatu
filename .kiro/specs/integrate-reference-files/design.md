# Design Document: Reference File Integration System

## Overview

This system provides an automated workflow for integrating reference implementation files from a temporary directory into the proper project structure. The system analyzes each file's purpose, dependencies, and target location, then safely integrates it while preserving existing functionality and maintaining build integrity.

The integration follows a dependency-aware approach where files are processed in an order that ensures dependencies are available when needed. Each integration is verified through the build system before proceeding to the next file.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Orchestrator                  │
│  - Coordinates overall workflow                             │
│  - Manages integration order                                │
│  - Tracks progress and state                                │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│   File       │  │  Dependency   │
│   Analyzer   │  │  Resolver     │
└───────┬──────┘  └──────┬────────┘
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   Integration   │
        │   Engine        │
        └────────┬────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼──────┐  ┌──────▼────────┐
│   Build      │  │  File         │
│   Verifier   │  │  Manager      │
└──────────────┘  └───────────────┘
```

### Component Responsibilities

1. **Integration Orchestrator**: Main controller that manages the entire integration workflow
2. **File Analyzer**: Examines files to determine type, dependencies, and target location
3. **Dependency Resolver**: Builds dependency graph and determines integration order
4. **Integration Engine**: Performs the actual file integration (merge or create)
5. **Build Verifier**: Validates that the build passes after each integration
6. **File Manager**: Handles file operations (read, write, delete, backup)

## Components and Interfaces

### File Analyzer

```typescript
interface FileAnalysis {
  filePath: string;
  fileName: string;
  fileType: FileType;
  targetLocation: string;
  dependencies: Dependency[];
  exports: Export[];
  hasExistingFile: boolean;
}

enum FileType {
  COMPONENT = "component",
  HOOK = "hook",
  SERVICE = "service",
  UTILITY = "utility",
  TYPE = "type",
  UNKNOWN = "unknown"
}

interface Dependency {
  importPath: string;
  isExternal: boolean;
  isResolved: boolean;
  sourceFile?: string; // If from another reference file
}

interface Export {
  name: string;
  type: "function" | "class" | "const" | "type" | "interface";
  isDefault: boolean;
}

function analyzeFile(filePath: string): FileAnalysis {
  // Read file content
  // Parse imports and exports using AST
  // Determine file type from naming and exports
  // Calculate target location based on type
  // Check if target file exists
  // Return analysis
}
```

### Dependency Resolver

```typescript
interface DependencyGraph {
  nodes: Map<string, FileNode>;
  edges: Map<string, string[]>; // source -> [dependencies]
}

interface FileNode {
  filePath: string;
  analysis: FileAnalysis;
  status: IntegrationStatus;
}

enum IntegrationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  SKIPPED = "skipped"
}

function buildDependencyGraph(analyses: FileAnalysis[]): DependencyGraph {
  // Create nodes for each file
  // Build edges based on dependencies
  // Return graph
}

function getIntegrationOrder(graph: DependencyGraph): string[] {
  // Perform topological sort
  // Handle circular dependencies
  // Return ordered list of file paths
}
```

### Integration Engine

```typescript
interface IntegrationResult {
  success: boolean;
  filePath: string;
  targetPath: string;
  action: "created" | "merged" | "skipped";
  conflicts?: Conflict[];
  error?: Error;
}

interface Conflict {
  type: "duplicate_export" | "incompatible_types" | "naming_collision";
  description: string;
  referenceCode: string;
  existingCode: string;
}

interface MergeStrategy {
  preserveExisting: boolean;
  addNewExports: boolean;
  updateImports: boolean;
  requestUserInput: boolean;
}

function integrateFile(
  analysis: FileAnalysis,
  strategy: MergeStrategy
): IntegrationResult {
  // If no existing file, create new file
  // If existing file, merge based on strategy
  // Update import paths
  // Return result
}

function mergeFiles(
  referenceContent: string,
  existingContent: string,
  strategy: MergeStrategy
): string {
  // Parse both files
  // Identify conflicts
  // Merge exports based on strategy
  // Combine imports
  // Return merged content
}
```

### Build Verifier

```typescript
interface BuildResult {
  success: boolean;
  errors: BuildError[];
  warnings: BuildWarning[];
}

interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  code?: string;
}

interface BuildWarning {
  file: string;
  message: string;
}

function verifyBuild(): BuildResult {
  // Run TypeScript compiler
  // Collect errors and warnings
  // Return result
}

function diagnoseErrors(errors: BuildError[]): DiagnosticResult {
  // Analyze error patterns
  // Suggest fixes
  // Return diagnostic
}
```

### File Manager

```typescript
interface BackupInfo {
  originalPath: string;
  backupPath: string;
  timestamp: number;
}

function createBackup(filePath: string): BackupInfo {
  // Create backup copy with timestamp
  // Return backup info
}

function restoreBackup(backup: BackupInfo): void {
  // Restore file from backup
  // Delete backup
}

function deleteFile(filePath: string): void {
  // Delete file
  // Log deletion
}

function updateImportPaths(
  content: string,
  oldPath: string,
  newPath: string
): string {
  // Parse imports
  // Update paths
  // Return updated content
}
```

## Data Models

### Integration State

```typescript
interface IntegrationState {
  totalFiles: number;
  processedFiles: number;
  completedFiles: string[];
  failedFiles: Map<string, Error>;
  skippedFiles: Map<string, string>; // file -> reason
  currentFile: string | null;
  backups: BackupInfo[];
  startTime: number;
  endTime?: number;
}
```

### Configuration

```typescript
interface IntegrationConfig {
  sourceDirectory: string; // "once-integrated-delete"
  targetDirectory: string; // "src"
  mergeStrategy: MergeStrategy;
  verifyAfterEach: boolean;
  deleteAfterSuccess: boolean;
  createBackups: boolean;
  stopOnError: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: File Type Classification
*For any* valid TypeScript/JavaScript file, the file analyzer should correctly identify its type (component, hook, service, utility, or type definition) based on its content, naming patterns, and exports.
**Validates: Requirements 1.1**

### Property 2: Import Extraction Completeness
*For any* TypeScript/JavaScript file with import statements, the file analyzer should extract all import statements without missing any.
**Validates: Requirements 1.2**

### Property 3: File Type to Target Location Mapping
*For any* file with a determined type, the system should map it to the correct target directory: hooks to src/hooks/, services to src/services/, utilities to src/utils/, types to src/types/, and components to src/layout/ or src/features/.
**Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 4: Dependency Resolution Status
*For any* import statement in a file, the system should correctly identify whether the dependency exists in the project or is missing.
**Validates: Requirements 1.4, 4.4**

### Property 5: Existing Functionality Preservation
*For any* merge operation between a reference file and an existing file, all exports present in the existing file should remain present in the merged result.
**Validates: Requirements 3.2**

### Property 6: Non-Conflicting Export Addition
*For any* merge operation where the reference file contains exports that don't conflict with the existing file, all non-conflicting exports from the reference file should be present in the merged result.
**Validates: Requirements 3.3**

### Property 7: New File Creation
*For any* reference file where no existing file exists at the target location, the system should create a new file with the reference file's content at the target location.
**Validates: Requirements 3.5**

### Property 8: Import Path Transformation
*For any* file being moved from one location to another, all relative import paths in the file should be correctly updated to reflect the new location, maintain correct relative path syntax, and point to the correct target locations for cross-references.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: Conditional File Deletion
*For any* reference file, it should only be deleted from once-integrated-delete when integration is complete, verified, and not awaiting user approval.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 10: Directory Cleanup
*For any* integration session, when all reference files are successfully integrated and deleted, the once-integrated-delete directory should be removed.
**Validates: Requirements 6.4**

### Property 11: Dependency Classification
*For any* missing dependency, the system should correctly classify it as either an external package or an internal module.
**Validates: Requirements 7.1**

### Property 12: Dependency-Aware Integration Order
*For any* set of reference files with dependencies between them, the integration order should process dependencies before their dependents (topological sort).
**Validates: Requirements 7.4, 8.2**

### Property 13: Independent File Alphabetical Ordering
*For any* set of reference files with no dependencies between them, they should be processed in alphabetical order.
**Validates: Requirements 8.4**

### Property 14: State Persistence and Resume
*For any* integration session that is interrupted and then resumed, already-completed files should not be reprocessed.
**Validates: Requirements 9.3, 9.4**

### Property 15: Rollback Round-Trip
*For any* file that is backed up before modification, rolling back should restore the file to its exact pre-modification state.
**Validates: Requirements 10.1, 10.2**

### Property 16: Reference File Restoration on Rollback
*For any* reference file that was deleted during integration, rolling back should restore it to the once-integrated-delete directory.
**Validates: Requirements 10.3**

## Error Handling

### Error Categories

1. **File System Errors**
   - File not found
   - Permission denied
   - Disk full
   - Recovery: Retry with exponential backoff, report to user

2. **Parse Errors**
   - Invalid TypeScript/JavaScript syntax
   - Malformed imports
   - Recovery: Skip file, report to user with details

3. **Build Errors**
   - Type errors
   - Missing dependencies
   - Import resolution failures
   - Recovery: Attempt auto-fix for common patterns, otherwise rollback and report

4. **Merge Conflicts**
   - Duplicate exports with different implementations
   - Incompatible type definitions
   - Recovery: Request user guidance, provide diff view

5. **Dependency Errors**
   - Circular dependencies
   - Missing internal modules
   - Missing external packages
   - Recovery: Report with suggestions, allow user to resolve

### Error Recovery Strategy

```typescript
interface ErrorRecoveryStrategy {
  canAutoRecover: boolean;
  requiresUserInput: boolean;
  shouldRollback: boolean;
  retryable: boolean;
}

function getRecoveryStrategy(error: IntegrationError): ErrorRecoveryStrategy {
  // Determine recovery approach based on error type
  // Return strategy
}
```

### Rollback Mechanism

The system maintains a transaction-like approach:
1. Before modifying any file, create a backup
2. Track all modifications in the integration state
3. On error, restore all modified files from backups
4. Restore deleted reference files
5. Clean up temporary files

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests for specific scenarios with property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific file type classification examples (React component, custom hook, service)
- Known conflict scenarios (duplicate exports, type mismatches)
- Edge cases (empty files, files with only comments, circular dependencies)
- Integration points (build verification, file system operations)
- Error conditions (missing files, permission errors, parse errors)

**Property-Based Tests** focus on:
- Universal properties across all inputs (file classification, import extraction, path transformation)
- Comprehensive input coverage through randomization (various file structures, import patterns, dependency graphs)
- Invariants that must hold (preservation of existing exports, correct dependency ordering)
- Round-trip properties (backup and restore, import path updates)

### Property Test Configuration

- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: **Feature: integrate-reference-files, Property {number}: {property_text}**

### Test Data Generation

For property-based tests, generate:
- Random TypeScript/JavaScript files with various structures
- Random import patterns (relative, absolute, aliased)
- Random dependency graphs (linear, tree, with cycles)
- Random file system states (existing files, missing files)
- Random merge scenarios (no conflicts, partial conflicts, full conflicts)

### Integration Test Scenarios

1. **Happy Path**: All files integrate successfully without conflicts
2. **Merge Scenario**: Some files have existing versions that need merging
3. **Dependency Chain**: Files depend on each other in a specific order
4. **Circular Dependencies**: Files have circular dependencies requiring user input
5. **Build Failure**: Integration causes build errors requiring rollback
6. **Interrupted Integration**: Integration is stopped and resumed
7. **Rollback Scenario**: Integration fails and requires full rollback

## Implementation Notes

### Technology Stack

- **Language**: TypeScript
- **AST Parsing**: TypeScript Compiler API or Babel
- **Build Verification**: TypeScript compiler (tsc)
- **File Operations**: Node.js fs module
- **Dependency Graph**: Custom implementation using topological sort
- **Property Testing**: fast-check library

### Performance Considerations

- Parse files in parallel where possible
- Cache AST results to avoid re-parsing
- Use incremental TypeScript compilation for build verification
- Batch file system operations

### User Experience

- Provide clear progress indicators
- Show detailed logs for each step
- Offer interactive conflict resolution
- Allow dry-run mode to preview changes
- Support undo/rollback at any point

### Future Enhancements

- Support for other file types (CSS, JSON, etc.)
- AI-assisted conflict resolution
- Automatic test generation for integrated files
- Integration with version control (git)
- Support for monorepo structures
