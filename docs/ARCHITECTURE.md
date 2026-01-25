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
├── features/             # All application features (domain + UI)
│   ├── analytics/        # Charts, leaderboards, insights
│   ├── auth/             # Session, identity, admin checks (consolidated)
│   ├── layout/           # App shell, navigation, backgrounds
│   ├── tournament/       # Competition logic, name management, profiles
│   └── ui/               # Design system primitives (Button, Card, Toast, etc.)
├── hooks/                # Reusable React hooks
├── providers/            # Context providers (Auth, Theme, Toast)
├── services/             # Backend integration
│   ├── errorManager.ts   # Centralized error handling
│   ├── SyncQueue.ts      # Offline-first queue
│   └── supabase/         # Supabase client and domain services
├── store/                # Zustand store (consolidated appSlice)
├── styles/               # CSS (tokens, components, animations, responsive)
├── types/                # TypeScript interfaces
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
| `features/auth/` | Authentication, authorization, admin checks (single file) |
| `hooks/` | Shared React hooks for browser state, forms, data fetching |
| `services/` | API clients, error handling, offline sync |
| `store/` | Global state management with Zustand |
| `utils/` | Pure functions: array ops, formatting, metrics |

---

## State Management

### Zustand Store

All slices are consolidated in `store/appSlice.ts`:

| Slice | Purpose |
|-------|---------|
| `tournament` | Tournament state, names, ratings, vote history |
| `user` | User session, preferences, admin status |
| `ui` | Theme, matrix mode, cat pictures toggle |
| `siteSettings` | Global site configuration |
| `errors` | Error handling and history |

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
| `supabase/client.ts` | Supabase client with `withSupabase` wrapper |
| `supabase/nameService.ts` | Name CRUD operations |
| `supabase/imageService.ts` | Image upload and management |
| `supabase/siteSettingsService.ts` | Global configuration |

All Supabase calls use `withSupabase()` for consistent error handling and offline support.

---

## Key Patterns

1. **Feature-First Organization** - All code organized under `source/features/` by domain
2. **CVA Variants** - Component variants via Class Variance Authority
3. **Error Boundaries** - Graceful error handling at feature boundaries
4. **Lazy Loading** - Dynamic imports for heavy components (Dashboard, Tournament)
5. **Path Aliases** - `@/features/ui`, `@utils`, `@services` for clean imports
6. **Consolidated Modules** - Related code merged into single files (auth, store)
