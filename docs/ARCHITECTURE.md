# Architecture & System Design

**Last Updated:** 2026-01-07
**Status:** Primary Blueprint for System Design & Data

> **Note:** For visual design guidance, design tokens, and UI/UX patterns, see [UI_UX.md](./UI_UX.md).

## 🏛️ System Overview

Naming Nosferatu is a modern React application centered around React 19, Vite, and Supabase.

### Tech Stack

- **Framework**: React 19.2.3 (Actions, `use` hook)
- **Build Tool**: Vite 7.3.0
- **State Management**: Zustand (Global) + TanStack Query (Server)
- **Styling**: TailwindCSS 4 + CSS Modules
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)

---

## 📊 Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `cat_name_options` | Available names | `id`, `name`, `avg_rating`, `is_active`, `is_hidden` |
| `cat_name_ratings` | User ratings | `user_name`, `name_id`, `rating`, `wins`, `losses` |
| `tournament_selections`| History | `user_name`, `name_id`, `tournament_id`, `selection_type` |
| `cat_app_users` | User profiles | `user_name`, `preferences`, `updated_at` |

**Verification Status**: ✅ Migrations match database schema as of Jan 2026.

---

## 🏗️ Design Principles

### 1. Decomposed Features

Features are organized by domain in `src/features/`. Complex views like `NameManagement` are split into specialized "Modes" (Tournament vs. Profile).

### 2. Store Slices

The global `useAppStore` is composed of focused slices:
- `tournamentSlice` - Tournament state and actions
- `userSlice` - User session and preferences
- `uiSlice` - UI state (modals, loading)
- `errorSlice` - Error handling
- `siteSettingsSlice` - Site-wide settings

### 3. Service Layer

Database operations are centralized in `src/shared/services/supabase/modules/`:
- `cat-names-consolidated.ts` - Name CRUD operations
- `general.ts` - General database utilities

---

## 📁 Project Structure

```
src/
├── core/                    # Core application logic
│   ├── constants/           # App-wide constants
│   ├── hooks/               # Core hooks (routing, storage, session)
│   └── store/               # Zustand store and slices
├── features/                # Feature modules
│   ├── analytics/           # Analysis dashboard
│   ├── auth/                # Authentication
│   ├── gallery/             # Photo gallery
│   ├── profile/             # User profile
│   └── tournament/          # Tournament feature
├── shared/                  # Shared utilities
│   ├── components/          # Reusable components
│   ├── hooks/               # Shared hooks
│   ├── providers/           # React context providers
│   ├── services/            # External service integrations
│   ├── styles/              # Global styles and tokens
│   └── utils/               # Utility functions
└── types/                   # TypeScript type definitions
```

---

## 🔄 Data Flow

```
User Action
    ↓
React Component
    ↓
Zustand Store (local state) ←→ TanStack Query (server state)
    ↓                              ↓
UI Update                    Supabase API
                                   ↓
                             PostgreSQL
```

---

## 🛠️ Technical Recommendations

1. **Maintain Type Coverage**: Continue replacing `any` in legacy catch blocks
2. **Feature Isolation**: Keep feature modules self-contained
3. **Query Caching**: Leverage TanStack Query for server state caching
4. **Error Boundaries**: Wrap feature modules in error boundaries
