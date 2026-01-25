# Architecture & System Design

**Last Updated:** January 2026

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
├── components/           # UI components
├── features/             # Domain modules
│   ├── analytics/        # Charts and leaderboards
│   ├── auth/             # Session and identity
│   └── tournament/       # Competition logic
├── hooks/                # Business logic hooks
├── providers/            # Context providers
├── shared/               # Reusable code
│   ├── components/       # Design system (Button, AdaptiveNav, etc.)
│   ├── layouts/          # Page wrappers
│   ├── services/         # ErrorManager, SyncQueue, Supabase client
│   └── utils/            # Helpers (cn, formatters)
├── store/                # Zustand store
│   └── slices/           # tournamentSlice, userSlice, settingsSlice, errorSlice
├── styles/               # CSS (core, components, animations, utilities)
└── types/                # TypeScript interfaces

supabase/                 # Database
├── migrations/           # SQL migrations
└── types.ts              # Generated types

docs/                     # Documentation
config/                   # Tool configuration
```

---

## State Management

### Zustand Store Slices

| Slice | Purpose |
|-------|---------|
| `tournamentSlice` | Tournament state and actions |
| `userSlice` | User session and preferences |
| `settingsSlice` | Site settings and UI state |
| `errorSlice` | Error handling |

### Data Flow

```
User Action → Component → Zustand Store ←→ TanStack Query → Supabase
                              ↓
                         UI Update
```

---

## Service Layer

Services are located in `source/shared/services/`:

| Service | Purpose |
|---------|---------|
| `ErrorManager` | Centralized error handling with retry logic |
| `SyncQueue` | Offline-first queue for failed operations |
| `supabase/client` | Supabase client with `withSupabase` wrapper |
| `supabase/modules/*` | Domain services (names, images, settings) |

All Supabase calls use `withSupabase()` for consistent error handling and offline support.

---

## Key Patterns

1. **Feature Isolation** - Domain logic lives in `source/features/`
2. **CVA Variants** - Component variants via Class Variance Authority
3. **Error Boundaries** - Graceful error handling at feature boundaries
4. **Lazy Loading** - Dynamic imports for heavy components
5. **Path Aliases** - `@utils`, `@services`, `@components` for clean imports
