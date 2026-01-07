# Architecture & System Design

**Last Updated:** 2026-01-07
**Status:** Primary Blueprint for System Design & Data

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
The global `useAppStore` is composed of focused slices: `tournamentSlice`, `userSlice`, `uiSlice`, `errorSlice`, and `siteSettingsSlice`.

### 3. Glassmorphism & Visual Polish
We use a hybrid of Tailwind for layout and CSS Modules for rich aesthetics (Glassmorphism, Liquid Glass).

---

## 🛠️ Technical Debt & Migration

### Migration Strategy
Our goal is to move all legacy components to the Design Token system in `src/shared/styles/design-tokens.css`.

#### ✅ Completed Refactors
- **PerformanceBadge**: Replaced hardcoded purple with `color-mix()` and tokens.
- **Error Component**: Removed all hardcoded RGB values.
- **NameGrid**: Switched to Masonry layout with glass surface tokens.

#### ⚠️ Active Migration Checklist
- [ ] **SetupCards.module.css**: Replace hardcoded pixel widths (`180px`) with responsive card width tokens.
- [ ] **Masonry Layout**: Integrate design tokens (currently uses hardcoded values in `useMasonryLayout` hooks).
- [ ] **Z-Index**: Continue replacing hardcoded `z-index` values with tokens (e.g., `--z-sticky`, `--z-modal`).

### Technical Recommendations
1. **Maintain Type Coverage**: Continue replacing `any` in legacy catch blocks.
2. **Standardize Breakpoints**: Use `var(--breakpoint-md)` instead of hardcoded `768px`.
3. **Print Styles**: Add print-specific CSS for tournament results and rankings.
