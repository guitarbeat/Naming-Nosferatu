# Design Document: Navigation System Consolidation

## Overview

This design consolidates the navigation system by creating a unified type system, centralized configuration, and streamlined transformation logic. The refactoring eliminates redundant type definitions across `navigation.config.ts`, `navbarCore.tsx`, and `NavbarConfig.ts` while maintaining all existing functionality and improving type safety.

The consolidation follows a clear separation of concerns:
- **Types Module**: Single source of truth for all navigation-related types
- **Configuration Module**: Declarative navigation structure and metadata
- **Transform Module**: Pure functions that convert configuration to runtime navigation items
- **Context/Hooks Module**: React-specific state management and side effects

## Architecture

### Current State Problems

1. **Type Duplication**: `NavItem` and `NavItemConfig` exist separately with overlapping concerns
2. **Scattered Logic**: Navigation building logic mixed with configuration
3. **Import Complexity**: Multiple import paths for related functionality
4. **Type Weakness**: Some optional properties lack clear contracts

### Proposed Architecture

```
src/shared/navigation/
├── types.ts              # All navigation type definitions
├── config.ts             # Navigation structure and metadata
├── transform.ts          # Configuration → Runtime transformation
├── context.tsx           # React context and provider
├── hooks.ts              # Navigation-related hooks
└── index.ts              # Barrel exports
```

### Module Responsibilities

**types.ts**
- Define all TypeScript interfaces and types
- Export unified navigation types
- No runtime logic or React dependencies

**config.ts**
- Export navigation item configurations
- Define navigation structure (main, utility, bottom)
- Import only types and icon components

**transform.ts**
- Pure functions for transforming config to runtime items
- Route matching and active state logic
- No React dependencies

**context.tsx**
- React context definition and provider
- Context value interface
- No business logic

**hooks.ts**
- Custom hooks for navigation state
- Side effects (localStorage, URL params)
- React-specific logic

**index.ts**
- Barrel exports for clean imports
- Public API surface

## Components and Interfaces

### Type System

```typescript
// types.ts

/**
 * Navigation item type classification
 */
export type NavItemType = "primary" | "secondary" | "utility";

/**
 * Base navigation item properties shared by config and runtime
 */
interface BaseNavItem {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  type: NavItemType;
}

/**
 * Configuration for a navigation item (declarative)
 */
export interface NavItemConfig extends BaseNavItem {
  route?: string;              // Navigation route
  action?: string;             // Action handler key
  permissions?: string[];      // Required permissions
  children?: NavItemConfig[];  // Nested navigation
  isExternal?: boolean;        // External link flag
  shortLabel?: string;         // Abbreviated label for mobile
  ariaLabel?: string;          // Accessibility label override
}

/**
 * Runtime navigation item (with computed state)
 */
export interface NavItem extends BaseNavItem {
  isActive: boolean;           // Computed active state
  onClick?: () => void;        // Click handler
  children?: NavItem[];        // Transformed children
  ariaLabel: string;           // Always present (defaults to label)
}

/**
 * Context for building navigation items
 */
export interface BuildNavItemsContext {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  onOpenPhotos?: () => void;
  onToggleAnalysis?: () => void;
  isAnalysisMode?: boolean;
}

/**
 * Navigation context value
 */
export interface NavbarContextValue {
  // View state
  view: string;
  setView: (view: string) => void;

  // Analysis mode
  isAnalysisMode: boolean;
  toggleAnalysis: () => void;

  // UI state
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;

  // Actions
  onOpenPhotos?: () => void;
  onOpenSuggestName?: () => void;

  // Auth state
  isLoggedIn: boolean;
  userName?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}
```

### Configuration Module

```typescript
// config.ts

import type { NavItemConfig } from "./types";
import {
  AnalysisIcon,
  PhotosIcon,
  TrophyIcon,
  VoteIcon,
} from "../components/AppNavbar/NavbarIcons";

/**
 * Main navigation items
 */
export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    key: "tournament",
    label: "Vote Now",
    route: "/",
    icon: VoteIcon,
    type: "primary",
    children: [
      {
        key: "vote",
        label: "Vote",
        route: "/",
        type: "secondary",
      },
    ],
  },
  {
    key: "results",
    label: "View Results",
    route: "/results",
    icon: TrophyIcon,
    type: "primary",
    children: [
      {
        key: "overview",
        label: "Overview",
        route: "/results",
        type: "secondary",
      },
      {
        key: "leaderboard",
        label: "Leaderboard",
        route: "/results/leaderboard",
        type: "secondary",
      },
      {
        key: "matchups",
        label: "Matchup History",
        route: "/results/matchups",
        type: "secondary",
      },
    ],
  },
  {
    key: "analysis",
    label: "Analyze Data",
    route: "/analysis",
    icon: AnalysisIcon,
    type: "primary",
    children: [
      {
        key: "global",
        label: "Global Trends",
        route: "/analysis",
        type: "secondary",
      },
      {
        key: "cats",
        label: "Cat Analytics",
        route: "/analysis/cats",
        type: "secondary",
      },
    ],
  },
  {
    key: "gallery",
    label: "Browse Gallery",
    route: "/gallery",
    icon: PhotosIcon,
    type: "primary",
    children: [
      {
        key: "grid",
        label: "Grid View",
        route: "/gallery",
        type: "secondary",
      },
    ],
  },
];

/**
 * Utility navigation items (profile, settings, etc.)
 */
export const UTILITY_NAV_ITEMS: NavItemConfig[] = [];

/**
 * Bottom navigation item keys (mobile)
 */
export const BOTTOM_NAV_ITEMS: string[] = [
  "tournament",
  "results",
  "explore",
];
```

### Action Buttons

In addition to route-based navigation items, the bottom navigation supports special **action buttons** that trigger modal dialogs or other UI interactions:

```typescript
// BottomNav.tsx - Action buttons alongside navigation
{onOpenSuggestName && (
  <button className="bottom-nav__item bottom-nav__item--action">
    <Lightbulb className="bottom-nav__icon" />
    <span className="bottom-nav__label">Suggest</span>
  </button>
)}
```

**Current Action Buttons:**
- **Suggest Name**: 💡 Lightbulb icon - Opens `NameSuggestionModal` for contributing new cat names
- **Mobile Menu**: ☰ Menu icon - Opens mobile navigation menu

**Design Pattern:**
- Action buttons use `bottom-nav__item--action` modifier class
- They appear after route-based navigation items
- They include haptic feedback on mobile devices
- They use semantic icons and accessible labels

### Transform Module

```typescript
// transform.ts

import type { NavItem, NavItemConfig, BuildNavItemsContext } from "./types";

/**
 * Check if a route is currently active
 */
function isRouteActive(route: string | undefined, currentRoute: string | undefined): boolean {
  if (!route || !currentRoute) return false;
  if (route === "/") return currentRoute === "/";
  return currentRoute.startsWith(route);
}

/**
 * Transform navigation configuration into runtime navigation items
 */
export function buildNavItems(
  context: BuildNavItemsContext,
  items: NavItemConfig[]
): NavItem[] {
  const { currentRoute, onNavigate } = context;

  return items.map((config) => {
    const isActive = isRouteActive(config.route, currentRoute);

    const onClick = config.route && onNavigate
      ? () => onNavigate(config.route!)
      : undefined;

    return {
      key: config.key,
      label: config.label,
      icon: config.icon,
      type: config.type,
      ariaLabel: config.ariaLabel || config.label,
      isActive,
      onClick,
      children: config.children
        ? buildNavItems(context, config.children)
        : undefined,
    };
  });
}

/**
 * Find a navigation item by key
 */
export function findNavItem(
  items: NavItemConfig[],
  key: string
): NavItemConfig | undefined {
  for (const item of items) {
    if (item.key === key) return item;
    if (item.children) {
      const found = findNavItem(item.children, key);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Get navigation items for bottom nav by keys
 */
export function getBottomNavItems(
  allItems: NavItemConfig[],
  keys: string[]
): NavItemConfig[] {
  return keys
    .map((key) => findNavItem(allItems, key))
    .filter((item): item is NavItemConfig => Boolean(item));
}
```

## Data Models

### NavItemConfig (Configuration)
- **Purpose**: Declarative navigation structure
- **Lifecycle**: Static, defined at build time
- **Usage**: Source of truth for navigation structure

### NavItem (Runtime)
- **Purpose**: Renderable navigation with computed state
- **Lifecycle**: Created dynamically based on current route/state
- **Usage**: Consumed by UI components

### BuildNavItemsContext
- **Purpose**: Dependency injection for transformation
- **Contains**: Current route, navigation handlers, feature flags
- **Usage**: Passed to `buildNavItems` function

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Type Consolidation Completeness

*For any* navigation-related type import in the codebase, it should be importable from the centralized `src/shared/navigation/types.ts` module or the barrel export `src/shared/navigation/index.ts`.

**Validates: Requirements 1.1, 1.2**

### Property 2: Configuration Transformation Idempotence

*For any* navigation configuration and build context, calling `buildNavItems` multiple times with the same inputs should produce equivalent output structures (same keys, labels, and hierarchy).

**Validates: Requirements 3.2, 3.3**

### Property 3: Active State Consistency

*For any* navigation item with a route, if the current route matches that item's route according to the matching rules, then `isActive` must be `true`, and if the route does not match, `isActive` must be `false`.

**Validates: Requirements 3.2, 3.3**

### Property 4: Child Navigation Preservation

*For any* navigation configuration item with children, the transformed runtime navigation item must have children with the same keys in the same order.

**Validates: Requirements 4.1, 4.3**

### Property 5: Type Safety Enforcement

*For any* navigation item creation, TypeScript compilation should fail if required properties (`key`, `label`, `type`) are missing.

**Validates: Requirements 5.1, 5.2**

### Property 6: Import Path Simplification

*For any* commonly used navigation type or function, it should be importable from the barrel export `src/shared/navigation` without needing to know the internal module structure.

**Validates: Requirements 6.1, 6.2, 6.3**

## Error Handling

### Type Errors
- **Strategy**: Leverage TypeScript's type system to catch errors at compile time
- **Implementation**: Use strict mode, avoid `any` types, enforce required properties
- **Recovery**: N/A (compile-time errors)

### Missing Navigation Items
- **Strategy**: Filter undefined items when building navigation
- **Implementation**: Use type guards (`filter((item): item is NavItemConfig => Boolean(item))`)
- **Recovery**: Gracefully omit missing items from rendered navigation

### Invalid Routes
- **Strategy**: Validate route format in configuration
- **Implementation**: Routes must start with `/` or be undefined
- **Recovery**: Log warning in development, skip invalid routes

### Context Missing
- **Strategy**: Throw descriptive error if context is used outside provider
- **Implementation**: Check for null context in `useNavbarContext`
- **Recovery**: Error boundary catches and displays user-friendly message

## Testing Strategy

### Unit Tests

**Type Module Tests**
- Verify type exports are available
- Test type compatibility between `NavItemConfig` and `NavItem`

**Transform Module Tests**
- Test `isRouteActive` with various route patterns
  - Root route (`/`) exact match
  - Nested routes (`/results/leaderboard`)
  - Non-matching routes
- Test `buildNavItems` transformation
  - Flat navigation structure
  - Nested navigation with children
  - Navigation with and without routes
- Test `findNavItem` search
  - Top-level items
  - Nested items
  - Non-existent items
- Test `getBottomNavItems` filtering
  - Valid keys
  - Invalid keys
  - Mixed valid/invalid keys

**Configuration Module Tests**
- Verify all navigation items have required properties
- Verify no duplicate keys at same level
- Verify route format consistency

### Property-Based Tests

**Property Test 1: Transformation Idempotence**
- Generate random `NavItemConfig[]` and `BuildNavItemsContext`
- Call `buildNavItems` twice with same inputs
- Assert outputs are deeply equal
- **Validates: Property 2**

**Property Test 2: Active State Correctness**
- Generate random navigation config and routes
- Build navigation items with each route as current
- Assert exactly one top-level item is active per route
- **Validates: Property 3**

**Property Test 3: Child Preservation**
- Generate random navigation config with children
- Build navigation items
- Assert all child keys and order are preserved
- **Validates: Property 4**

**Property Test 4: Key Uniqueness**
- Generate random navigation config
- Extract all keys (including nested)
- Assert no duplicate keys exist
- **Validates: Requirements 4.1**

### Integration Tests

**Component Integration**
- Test `AppNavbar` renders with consolidated navigation
- Test `BottomNav` renders with consolidated navigation
- Test navigation click handlers trigger correct actions
- Test mobile menu opens/closes correctly

**Context Integration**
- Test `NavbarProvider` provides correct context values
- Test hooks access context correctly
- Test context updates trigger re-renders

### Test Configuration

- Minimum 100 iterations per property test
- Use `fast-check` library for property-based testing
- Tag format: `Feature: navigation-consolidation, Property {number}: {property_text}`