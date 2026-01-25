# Architecture & System Design

**Last Updated:** January 2026
**Status:** Primary Blueprint for System Design & Data

> **Note:** For visual design guidance, design tokens, and UI/UX patterns, see [UI_UX.md](./UI_UX.md).

## 🏛️ System Overview

**Name Nosferatu** is a tournament platform where cat names evolve through a deliberate lifecycle of comparison and elimination. The system enforces mathematical rigor while embracing the obsessive nature of finding the "perfect" name.

### Tech Stack

- **Framework**: React 19.2.3 (Actions, `use` hook)
- **Build Tool**: Vite 7.3.1
- **State Management**: Zustand (Global) + TanStack Query (Server)
- **Routing**: `react-router-dom` v7 (Lazy loading and SPA navigation)
- **Styling**: Tailwind CSS v4 + Class Variance Authority (CVA) + Design Tokens
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Domain Logic**: TypeScript with strict invariants
- **Animations**: Framer Motion 12.29.0
- **Forms**: React Hook Form with validation
- **Integrations**: `@heroui/react`, `@hello-pangea/dnd`, `lovable-tagger`

---

## 🎯 Core Business Concept

**Name Nosferatu** transforms generic name picking into deliberate obsession. Names follow a lifecycle of scientific comparison: **Candidate** → **Intake** → **Tournament** → **Winner** → **Archive**. Every decision matters, every comparison reveals truth.

---

## 📊 Domain Model v2.0

### Core Entities

#### NameItem

The fundamental entity for cat names.

```typescript
export interface NameItem {
  id: string | number;
  name: string;
  description?: string;
  isHidden?: boolean;
  isSelected?: boolean;
  avgRating?: number;
  wins?: number;
  losses?: number;
  status?: "candidate" | "intake" | "tournament" | "eliminated" | "archived";
  provenance?: Array<{
    action: string;
    timestamp: string;
    userId?: string;
    details?: Record<string, unknown>;
  }>;
}
```

#### Tournament State (Global Store)

The current state of an active tournament session.

```typescript
interface TournamentState {
  names: NameItem[] | null;
  ratings: Record<string, { rating: number; wins?: number; losses?: number }>;
  isComplete: boolean;
  isLoading: boolean;
  voteHistory: VoteData[];
  selectedNames: NameItem[];
}

interface VoteData {
  match: {
    left: { name: string; id: string | number | null; outcome: string };
    right: { name: string; id: string | number | null; outcome: string };
  };
  result: number; // -1 (left win), 1 (right win), 0.5 (draw)
  ratings: Record<string, number>;
  timestamp: string;
}
```

#### User State

```typescript
export interface UserState {
  name: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  avatarUrl?: string;
  preferences: {
    theme?: string;
    notifications?: boolean;
    showCatPictures?: boolean;
    matrixMode?: boolean;
  };
}
```

### Name Lifecycle State Machine

```
candidate → intake → tournament → (eliminated | archived)

- candidate: Initial state for new names
- intake: Categorized and prepared for competition
- tournament: Actively competing in brackets
- eliminated: Lost in tournament (can be revived)
- archived: Preserved winner or historically significant
```

### Lifecycle Business Rules

#### Creation & Intake

```typescript
// Names enter as candidates
const newName: NameItem = {
  name: "Nosferatu",
  status: "candidate",
  provenance: [
    {
      action: "created",
      timestamp: new Date().toISOString(),
      details: { source: "user_input" },
    },
  ],
};
```

#### Tournament Participation

```typescript
// Names enter tournament from intake or archived
function enterTournament(name: NameItem): NameItem {
  return {
    ...name,
    status: "tournament",
    provenance: [
      ...(name.provenance || []),
      {
        action: "entered_tournament",
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
```

### Business Invariants

- **Determinism**: All Elo ratings are calculated deterministically based on match history.
- **Integrity**: Ratings must remain within bounds (800-2400) and are persisted to Supabase.
- **Uniqueness**: Composite primary keys (`user_name`, `name_id`) ensure rating integrity.

### Core Algorithms

#### Elo Rating System

The system uses a standard Elo algorithm with a K-factor of 32 (doubled for new players) to calculate rating shifts after each comparison.

```typescript
export class EloRating {
  getExpectedScore(ra: number, rb: number) {
    return 1 / (1 + 10 ** ((rb - ra) / 400));
  }
  updateRating(r: number, exp: number, act: number, games = 0) {
    const k = games < 10 ? 64 : 32;
    return Math.round(r + k * (act - exp));
  }
}
```

#### Tournament Match Generation

Matches are generated using the `PreferenceSorter`, which ensures every possible pair is compared exactly once (Round Robin) using a linear index calculation to save memory.

```typescript
export class PreferenceSorter {
  getNextMatch() {
    const n = this.items.length;
    const totalPairs = (n * (n - 1)) / 2;
    // ... index calculation logic ...
    return { left: a, right: b };
  }
}
```

---

## 📊 Database Schema

### Core Tables

| Table                   | Purpose                | Key Fields                                                             |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `cat_app_users`         | User profiles          | `user_name`, `preferences`, `created_at`, `updated_at`                 |
| `user_roles`            | RBAC permissions       | `user_id`, `user_name`, `role`                                         |
| `cat_name_options`      | Available names        | `id`, `name`, `avg_rating`, `is_active`, `is_hidden`, `categories`     |
| `cat_name_ratings`      | User ratings           | `user_name`, `name_id`, `rating`, `wins`, `losses`                     |
| `tournament_selections` | History                | `user_name`, `name_id`, `tournament_id`, `selection_type`              |
| `site_settings`         | Global config          | `key`, `value`                                                         |
| `audit_log`             | Audit trail            | `table_name`, `operation`, `old_values`, `new_values`                  |

**Verification Status**: ✅ Migrations match database schema as of Jan 2026.

---

## 🏗️ Design Principles

### 1. Decomposed Features

Features are organized by domain in `source/features/`. Complex views like `NameManagementView` are split into specialized "Modes" (Tournament vs. Profile).

### 2. Store Slices

The global `useAppStore` (managed by Zustand) is composed of focused slices:

- `tournamentSlice` - Tournament state and actions
- `userSlice` - User session and preferences
- `uiSlice` - UI state (modals, loading)
- `errorSlice` - Error handling
- `settingsSlice` - Site-wide settings

### 3. Service Layer (Supabase)

The service layer is decomposed into domain-specific modules located in `source/services/` or `source/features/[feature]/services/`.

- **AdminService**: User management and roles.
- **ImageService**: Cat picture management.
- **NameService**: Name lifecycle management.
- **AnalyticsService**: Leaderboards and history.
- **SiteSettingsService**: Global config.

All services use a standardized `withSupabase` wrapper to ensure consistent error handling.
---

## 📁 Project Structure

```
source/
├── components/              # Core UI and layout views
│   ├── NameManagementView/  # Complex name management logic
│   └── ...
├── core/                    # App initialization (if applicable)
├── features/                # Domain-specific logic
│   ├── analytics/           # Charts and leaderboards
│   ├── auth/                # Session and identity
│   └── tournament/          # Competition flow and loops
├── hooks/                   # Business logic hooks
├── providers/               # Context providers (Toast, Theme, etc)
├── services/                # API and External integrations
├── shared/                  # Reusable primitives
│   ├── components/          # Design system atoms
│   ├── hooks/               # Generic hooks (e.g., useStorage)
│   ├── layouts/             # Page wrappers
│   └── utils/               # Logic helpers (cn, formatters)
├── store/                   # Zustand definitions
│   └── slices/              # Focused state modules
├── styles/                  # Global CSS and themes
└── types/                   # Centralized TS interfaces
```

---

## 🔄 Data Flow

```
User Action
    ↓
React Component (Feature)
    ↓
Zustand Store (local state) ←→ TanStack Query (server state)
    ↓                              ↓
UI Update                    Supabase API (PostgreSQL)
                                   ↓
                         Domain Invariants Validation
```

---

### User & System Insights

The analytics engine processes raw tournament data into actionable insights for both individuals and the global community.

```typescript
export interface NameWithInsight {
  id: string | number;
  name: string;
  rating: number;
  wins: number;
  selected: number;
  insights: string[];
}

export interface SummaryStats {
  avgRating: number;
  totalSelected?: number;
  topName?: {
    name: string;
    rating: number;
  };
  totalUsers?: number;
  totalRatings?: number;
}
```

---

## 🔌 API Design

### Core Service Pattern

External services (primarily Supabase) are accessed through a standardized `withSupabase` wrapper that handles availability, authentication context, and error propagation.

- **`tournamentsAPI`**: Handles tournament creation and rating persistence.
- **`ErrorManager`**: Centralized global error handling and UI notifications.
- **`SiteSettingsService`**: Manages global application configuration.
- **`AdminStatus`**: Validates user roles and permissions.

---

## 🚀 Migration Strategy

### Database Schema Evolution

```sql
-- Add lifecycle status to names
ALTER TABLE cat_name_options
ADD COLUMN status name_status_enum DEFAULT 'candidate',
ADD COLUMN provenance jsonb DEFAULT '[]'::jsonb;

-- Add tournament constraints
ALTER TABLE tournaments
ADD COLUMN constraints jsonb,
ADD COLUMN expert_mode boolean DEFAULT false;

-- Add vote context
ALTER TABLE votes
ADD COLUMN context jsonb;
```

### Application Migration

1. **Phase 1**: Add status field with backward compatibility
2. **Phase 2**: Implement provenance logging
3. **Phase 3**: Add constraint validation
4. **Phase 4**: Enable new lifecycle features

---

## 🛠️ Technical Recommendations

1. **Maintain Type Coverage**: Continue replacing `any` in legacy catch blocks.
2. **Feature Isolation**: Keep feature modules self-contained in `source/features/`.
3. **Query Caching**: Leverage TanStack Query for server state caching.
4. **Error Boundaries**: Wrap feature modules in the shared `ErrorBoundary` component.
5. **Invariant Enforcement**: Use TypeScript + Zod for runtime business rule validation.
6. **Performance**: Use dynamic imports (lazy loading) for heavy domain components.
