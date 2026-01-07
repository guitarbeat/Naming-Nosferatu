# Development Guide

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start development server
pnpm run lint         # Run Biome linter + TypeScript checks (src + scripts)
pnpm run lint:fix     # Auto-fix linting issues (src + scripts)
pnpm run lint:biome   # Run Biome linter only
pnpm run lint:types   # Run TypeScript type checking
pnpm run format       # Format code with Biome (src + scripts)
pnpm run check        # Run all checks (Types, Lint, Limits, Deps)
pnpm run check:limits # Strictly enforce file size limits (src + scripts)
```

## Coding Standards

### File Size Limits
We strictly enforce file size limits to prevent monoliths.
- **TSX/TS**: 400 lines
- **CSS**: 750 lines
- **JS** (scripts): 200 lines

File size checks run on both `src/` and `scripts/` directories. If you hit a limit, **refactor**:
1.  **Extract Sub-components**: Move render logic to a child component.
2.  **Extract Hooks**: Move state/effect logic to `hooks/`.
3.  **Split CSS**: Create specific CSS modules for sub-components.
4.  **Split Scripts**: Break large utility scripts into smaller modules.

### Folder Structure

### State Management
- **Local State**: Use `useState` for UI-only state.
- **Global State**: Use `useAppStore` (Zustand) for shared state. Add a new slice in `src/core/store/slices/` if adding a new domain.
- **Server State**: Use `useQuery` (TanStack Query) for all API data.

### Styling
- Use **CSS Modules** (`*.module.css`) for all component styling.
- Use **Design Tokens** (variables) from `design-tokens.css` for colors, spacing, and radius.
- Avoid inline styles.
- Avoid global CSS classes.

## Code Quality & Linting

### Linting Tools
- **Biome**: Fast linter and formatter for JavaScript/TypeScript/CSS
  - Checks both `src/` and `scripts/` directories
  - Auto-fixable issues: `pnpm run lint:fix`
  - Formatting: `pnpm run format`
- **TypeScript**: Strict type checking enabled
  - `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`
  - Includes `scripts/` directory in type checking

### Linting Rules
- **Complexity**: Detects useless code, empty exports, unnecessary fragments
- **Suspicious**: Catches bugs like double equals, duplicate cases, unsafe code
- **Style**: Enforces `const` over `let`, modern syntax, naming conventions
- **Correctness**: Unused imports/variables, exhaustive dependencies
- **Performance**: Warns about accumulating spreads, delete operations
- **Security**: Flags dangerous patterns like `dangerouslySetInnerHtml`

### Naming Conventions
- **Standard**: Use `camelCase` for variables, functions, and properties
- **Exceptions**: `snake_case` for database columns, `UPPER_CASE` for constants
- **Suppressions**: Use `biome-ignore` comments with explanations when exceptions are required
- See [Naming Conventions Guide](./NAMING_CONVENTIONS.md) for detailed guidelines on when and how to handle naming exceptions

## Contribution Workflow
1.  Create a feature branch.
2.  Implement changes following V2 principles.
3.  Run `pnpm run check` to verify types, linting, and limits.
4.  Ensure all checks pass (linting includes both `src/` and `scripts/`).
5.  Submit PR.

## Feature Development Workflow

### 📏 Strict File Limits
To prevent "God Components" and unmaintainable technical debt, we enforce strict line limits:
-   **TSX/TS Files**: Max **400 lines**.
-   **CSS Modules**: Max **750 lines**.

**Why?** Large files are harder to read, harder to test, and prone to merge conflicts.
**Enforcement**: Use `pnpm run check:limits` to verify your changes before pushing.

### 📦 Colocation
Keep related code together. If a component, hook, or style is only used by one feature, it belongs in that feature's directory, not in `src/shared`.

### 🧩 Composition over Inheritance
Build complex UIs by composing smaller, focused components rather than creating massive configuration-driven components.

### 🚨 CSS Management
-   **Modules Only**: All styles must use CSS Modules (`.module.css`).
-   **No Global leaking**: Never use global selectors (e.g., `body`, `h1`) inside a module.
-   **Decomposition**: If a CSS file hits 750 lines, split it by logical section (e.g., `FeatureLayout.module.css`, `FeatureTheme.module.css`) or extract reusable tokens.

### 📂 Directory Structure

New features should follow this structure:

```text
src/features/YourFeature/
├── components/                 # Sub-components specific to this feature
│   ├── SubComponent/
│   │   ├── SubComponent.tsx
│   │   ├── SubComponent.module.css
│   │   └── index.ts
│   └── SharedComponent.tsx    # Simple shared components
├── hooks/                      # Business logic extracted from UI
│   ├── useFeatureLogic.ts
│   └── useFeatureData.ts
├── YourFeature.tsx            # Main container/entry component
├── YourFeature.module.css     # Layout styles for the container
└── index.ts                   # Public API exports
```

### Example: Tournament Feature

```text
src/features/tournament/
├── components/
│   ├── TournamentToolbar/...
│   ├── NameGrid/...
│   └── TournamentSetup/...
├── hooks/
│   ├── useTournamentController.ts
│   └── useTournamentSetupHooks.ts
├── Tournament.tsx
├── Tournament.module.css
└── index.ts
```

### ✅ Checklist Before Push
-   [ ] `pnpm run lint` passes (No biome or type errors).
-   [ ] `pnpm run check:limits` passes (No files > 400/750 lines).
-   [ ] Unused code removed (`pnpm exec knip`).

## Iterative Development Workflow

### Automation

This workflow can be automated using the provided scripts:

- **Quick check**: `pnpm run check` - Returns exit code 0 if clean, non-zero if issues found
- **Full automation**: `./workflow.sh` - Runs complete workflow with error reporting
- **Dead code analysis**: `pnpm run check:deps` or `pnpm exec knip` - Find unused files, exports, and dependencies
- **CI/CD friendly**: All commands return proper exit codes for pipeline integration

### Workflow Steps

#### 1. Lint Check (Required After Each Change)

**Command**: `pnpm run lint`
**Exit Code**:
- `0` = Success (all checks passed)
- `1` = Failure (errors found)

**What it checks**:
- Biome linter for `src/` and `scripts/` directories
- TypeScript type checking for `src/`, `config/`, and `scripts/`

**Priority Order**:
1. TypeScript errors (blocking) - `pnpm run lint:types`
2. Biome linting errors - `pnpm run lint:biome`

#### 2. Auto-fix (When Applicable)

**Command**: `pnpm run lint:fix`
**Exit Code**:
- `0` = Fixes applied (or no fixes needed)
- `1` = Some issues could not be auto-fixed

**What it fixes**:
- Biome auto-fixable issues in `src/` and `scripts/` directories
- Formatting, unused imports, and other auto-correctable problems

#### 3. Build Verification

**Command**: `pnpm run build`
**Exit Code**:
- `0` = Build successful
- `1` = Build failed

**Rule**: Run build after significant changes to catch:
- Missing imports
- Tree-shaking issues
- Bundle size regressions

#### 4. Usability Tests (On Request Only)

**Prerequisites**:
- Lint must pass: `pnpm run lint` returns exit code 0
- TypeScript must be clean: `pnpm run lint:types` returns exit code 0
- Build must pass: `pnpm run build` returns exit code 0

**Manual Steps** (not automatable):
1. Select two names
2. Start a tournament
3. Play through to completion
4. View the results page
5. Verify the reordering feature

## Further Reading

### Core Documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design and tech stack
- [Naming Conventions](./NAMING_CONVENTIONS.md) - When to use snake_case/UPPER_CASE and how to suppress warnings

### Workflow & Quality
- [Maintainability Review](./MAINTAINABILITY_REVIEW.md) - Code quality improvements and technical debt

### Planning
- [Roadmap](./ROADMAP.md) - Completed milestones and future goals

