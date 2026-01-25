# Component Documentation

**Last Updated:** January 2026

## Component Locations

| Category | Location |
|----------|----------|
| **Shared UI** | `source/shared/components/` |
| **Feature UI** | `source/features/*/` |
| **Layouts** | `source/shared/layouts/` |

## Key Components

### Shared Components

| Component | Description |
|-----------|-------------|
| `AdaptiveNav` | Responsive navigation (mobile/desktop) |
| `Button` | Primary button with CVA variants |
| `ErrorBoundary` | Error boundary with fallback UI |
| `FormPrimitives` | Input, Select, Label components |
| `LiquidGlass` | Glassmorphism effect |
| `Loading` | Loading spinner/skeleton |
| `TournamentToolbar` | Filter and action toolbar |

### Feature Components

| Feature | Key Components |
|---------|----------------|
| **Tournament** | `Tournament`, `TournamentSetup`, `Dashboard` |
| **Analytics** | `AnalysisDashboard`, `Charts` |
| **Auth** | Login integrated into `TournamentSetup` |

---

## Standards

### Naming

- **Components**: `PascalCase` (e.g., `AdaptiveNav.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useProfile.ts`)
- **CSS classes**: `kebab-case`

### File Structure

```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.css       # Styles (if needed)
└── index.ts               # Barrel export (if subfolder)
```

### Code Quality

- **Max 400 lines** per component file
- **TypeScript interfaces** for all props
- **CVA** for component variants
- **Design tokens** for spacing, colors, typography

---

## Component Template

When creating new components:

```tsx
import { cn } from "@utils/cn";

interface ComponentNameProps {
  /** Description of prop */
  propName: string;
  /** Optional prop with default */
  optional?: boolean;
}

export function ComponentName({ propName, optional = false }: ComponentNameProps) {
  return (
    <div className={cn("base-styles", optional && "optional-styles")}>
      {propName}
    </div>
  );
}
```

### Checklist

- [ ] TypeScript interfaces for props
- [ ] Keyboard accessible
- [ ] Responsive (mobile/desktop)
- [ ] Uses design tokens
- [ ] Error handling where needed
