# Component Documentation

**Last Updated:** January 25, 2026

## Component Locations

| Category | Location |
|----------|----------|
| **UI Primitives** | `source/features/ui/` |
| **Layout** | `source/features/layout/` |
| **Tournament** | `source/features/tournament/` |
| **Analytics** | `source/features/analytics/` |
| **Auth** | `source/features/auth.ts` |

## Key Components

### UI Primitives (`features/ui/`)

| Component | Description |
|-----------|-------------|
| `Button` | Primary button with CVA variants |
| `Card` | Container component with variants |
| `Error` | Error boundary with fallback UI |
| `FormPrimitives` | Input, Select, Label components |
| `LiquidGlass` | Glassmorphism effect |
| `StatusIndicators` | Loading spinners, badges |
| `Toast` | Notification system |
| `Charts` | Data visualization components |

### Layout Components (`features/layout/`)

| Component | Description |
|-----------|-------------|
| `AppLayout` | Main app shell and structure |
| `AdaptiveNav` | Responsive navigation (mobile/desktop) |
| `CollapsibleHeader` | Collapsible section headers |
| `CatBackground` | Animated cat background |
| `FloatingBubbles` | User bubble animations |

### Feature Components

| Feature | Key Components |
|---------|----------------|
| **Tournament** | `Tournament`, `TournamentSetup`, `TournamentFlow`, `TournamentToolbar`, `Dashboard`, `NameGrid`, `ProfileMode` |
| **Analytics** | `AnalysisDashboard` (with `analyticsHooks`, `analyticsService`) |
| **Auth** | Consolidated in `features/auth.ts` |

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
import { cn } from "@utils";

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
