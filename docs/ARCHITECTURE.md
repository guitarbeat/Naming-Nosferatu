# Architecture & System Design

**Last Updated:** January 25, 2026

> For visual design guidance and design tokens, see [UI_UX.md](./UI_UX.md).

## System Overview

**Name Nosferatu** is a tournament platform for ranking cat names through pairwise comparison using an Elo rating system.

### Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 with TypeScript |
| **Build** | Vite |
| **State** | Zustand (client) + TanStack Query (server) |
| **Styling** | Tailwind CSS v4 + CVA |
| **Backend** | Supabase (PostgreSQL, Auth) |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod |

---

## Core Domain

### Name Lifecycle

```
candidate → tournament → (eliminated | archived)
```

Names are created, compete in tournaments via pairwise comparison, and are either eliminated or archived as winners.

### Key Entities

**NameItem** - A cat name with metadata:
- `id`, `name`, `description`
- `avgRating`, `wins`, `losses`
- `isHidden`, `isSelected`

**TournamentState** - Active tournament session:
- `names` - Competing names
- `ratings` - Elo ratings per name
- `voteHistory` - Match results
- `isComplete` - Tournament finished

**UserState** - Current user:
- `name`, `isLoggedIn`, `isAdmin`
- `preferences` - Theme, notifications

### Elo Rating System

Standard Elo with K-factor of 32 (64 for new players):

```typescript
getExpectedScore(ra, rb) = 1 / (1 + 10 ** ((rb - ra) / 400))
updateRating(r, expected, actual, games) = r + k * (actual - expected)
```

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `cat_app_users` | User profiles and preferences |
| `cat_user_roles` | RBAC permissions |
| `cat_name_options` | Available names with ratings |
| `cat_name_ratings` | Per-user name ratings |
| `cat_tournament_selections` | Tournament history |
| `site_settings` | Global configuration |

---

## Project Structure

```
source/
├── App.tsx               # Root application component
├── constants.ts          # Application constants
├── main.tsx              # Entry point
├── navigation.ts         # Route definitions
├── store.ts              # Zustand store (consolidated)
├── types.ts              # TypeScript interfaces
├── shims.d.ts            # Module declarations
├── features/             # All application features (domain + UI)
│   ├── analytics/        # Charts, leaderboards, insights
│   ├── auth.ts           # Session, identity, admin checks (consolidated)
│   ├── layout/           # App shell, navigation, backgrounds
│   ├── tournament/       # Competition logic, components, name management
│   │   ├── components/   # Extracted UI components (SwipeableCards, RankingAdjustment)
│   │   ├── context/      # Tournament-specific context
│   │   ├── hooks/        # Tournament-specific hooks
│   │   └── types.ts      # Tournament-specific types
│   └── ui/               # Design system primitives (Button, Card, Toast, etc.)
├── hooks/                # Reusable React hooks
├── providers/            # Context providers (Auth, Theme, Toast)
├── services/             # Backend integration
│   ├── errorManager.ts   # Centralized error handling
│   ├── SyncQueue.ts      # Offline-first queue
│   └── supabase/         # Supabase client and domain services
├── styles/               # CSS (tokens, components, animations, responsive)
└── utils/                # Helper functions (cn, formatters, etc.)

supabase/                 # Database
├── migrations/           # SQL migrations
└── types.ts              # Generated types

docs/                     # Documentation
config/                   # Tool configuration
```

### Directory Roles

| Directory | Purpose |
|-----------|---------|
| `features/ui/` | Design system: Button, Card, Toast, Error, StatusIndicators, etc. |
| `features/layout/` | App shell: AppLayout, AdaptiveNav, CatBackground, FloatingBubbles |
| `features/tournament/` | Tournament logic, name management, profiles, Elo ratings |
| `features/analytics/` | Analysis dashboard, charts, leaderboards |
| `features/auth.ts` | Authentication, authorization, admin checks (single file) |
| `hooks/` | Shared React hooks for browser state, forms, data fetching |
| `services/` | API clients, error handling, offline sync |
| `store.ts` | Global state management with Zustand |
| `types.ts` | TypeScript type definitions |
| `utils/` | Pure functions: array ops, formatting, metrics |

---

## State Management

### Zustand Store

All state is consolidated in `store.ts`, which includes slice definitions, store creation, and the initialization hook:

| Slice | Purpose |
|-------|---------|
| `tournament` | Tournament state, names, ratings, vote history |
| `user` | User session, preferences, admin status |
| `ui` | Theme, matrix mode, cat pictures toggle |
| `siteSettings` | Global site configuration |
| `errors` | Error handling and history |

Key exports from `store.ts`:
- `useAppStore` - Main store hook (default export)
- `useAppStoreInitialization` - Hook to initialize store from localStorage
- `updateSlice` - Helper for nested state updates

### Data Flow

```
User Action → Component → Zustand Store ←→ TanStack Query → Supabase
                              ↓
                         UI Update
```

---

## Service Layer

Services are located in `source/services/`:

| Service | Purpose |
|---------|---------|
| `errorManager.ts` | Centralized error handling with retry logic |
| `SyncQueue.ts` | Offline-first queue for failed operations |
| `supabase/client.ts` | Consolidated Supabase client, TanStack Query client, `withSupabase` wrapper, and service re-exports |
| `supabase/nameService.ts` | Name CRUD operations |
| `supabase/imageService.ts` | Image upload and management |
| `supabase/siteSettingsService.ts` | Global configuration |

All Supabase calls use `withSupabase()` for consistent error handling and offline support.

The `supabase/client.ts` module consolidates:
- Supabase client configuration and initialization
- TanStack Query client setup (`queryClient`)
- Re-exports from all service modules for convenient imports

---

## Key Patterns

1. **Feature-First Organization** - All code organized under `source/features/` by domain
2. **CVA Variants** - Component variants via Class Variance Authority
3. **Error Boundaries** - Graceful error handling at feature boundaries
4. **Lazy Loading** - Dynamic imports for heavy components (Dashboard, Tournament)
5. **Path Aliases** - `@/features/ui`, `@utils`, `@services`, `@store`, `@types`, `@supabase/client` for clean imports
6. **Consolidated Modules** - Related code merged into single files:
   - `store.ts` - All Zustand slices + store creation + initialization
   - `types.ts` - All TypeScript type definitions
   - `features/auth.ts` - All auth logic consolidated
   - `services/supabase/client.ts` - Supabase client + query client + service re-exports
