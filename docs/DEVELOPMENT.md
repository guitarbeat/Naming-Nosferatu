# Development Guide

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### Commands
### Commands
```bash
pnpm install          # Install dependencies
pnpm run dev          # Start development server
pnpm run check        # Run all checks (Types, Lint, Limits, Deps)
pnpm run check:limits # strictly enforce file size limits
```

## Coding Standards

### File Size Limits
We strictly enforce file size limits to prevent monoliths.
- **TSX**: 400 lines
- **CSS**: 500 lines

If you hit a limit, **refactor**:
1.  **Extract Sub-components**: Move render logic to a child component.
2.  **Extract Hooks**: Move state/effect logic to `hooks/`.
3.  **Split CSS**: Create specific CSS modules for sub-components.

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

## Contribution Workflow
1.  Create a feature branch.
2.  Implement changes following V2 principles.
3.  Run `pnpm run check` to verify types and limits.
4.  Submit PR.

## Further Reading
## Further Reading
- [Feature Workflow Guide](./FEATURE_WORKFLOW.md) (Standard for new features)
- [Workflow & Automation Details](./WORKFLOW.md)
- [Architecture Overview](./ARCHITECTURE.md)

