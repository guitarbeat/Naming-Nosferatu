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
### Folder Structure
See [Feature Workflow](./FEATURE_WORKFLOW.md) for the standard directory structure of new features.

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

## Further Reading

### Core Documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design and tech stack
- [Feature Workflow Guide](./FEATURE_WORKFLOW.md) - Standard for new features (includes template)
- [Naming Conventions](./NAMING_CONVENTIONS.md) - When to use snake_case/UPPER_CASE and how to suppress warnings

### Workflow & Quality
- [Iterative Workflow Guide](./WORKFLOW.md) - Development workflow, linting, and automation
- [Maintainability Review](./MAINTAINABILITY_REVIEW.md) - Code quality improvements and technical debt

### Planning
- [Roadmap](./ROADMAP.md) - Completed milestones and future goals

