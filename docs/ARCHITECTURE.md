# Architecture & System Design

## Overview
Naming Nosferatu is a React application for managing cat names and tournaments. It uses a modern stack centered around React 19, Vite, and Supabase.

## Tech Stack

### Core
- **Framework**: React 19.2.3 (Actions, `use` hook)
- **Build Tool**: Vite 7.3.0
- **Language**: TypeScript (Strict)
- **State Management**: 
    - **Global**: Zustand 5.0.9 (User, Tournament, UI state)
    - **Server**: TanStack Query 5.90.16 (Supabase data)

### Styling (`src/shared/styles/`)
- **Hybrid Approach**: TailwindCSS 4 + CSS Modules
- **Design Tokens**: `design-tokens.css` (Base values), `themes.css` (Light/Dark modes)
- **Animations**: Framer Motion 12 + CSS Transitions

### Backend
- **Supabase**: PostgreSQL, Auth, Realtime

## V2 Architecture Principles

To maintain scalability, the codebase adheres to **V2 Design Principles**:

### 1. File Size Limits
- **Components**: Max **400 lines**.
    - *Mitigation*: Split into sub-components or extract hooks.
- **CSS Modules**: Max **750 lines**.
    - *Mitigation*: Extract component-specific styles or use shared primitives.

### 2. Decomposed Structure
Features are organized by domain, not technology.
- **Shared Components**: `src/shared/components/{Name}/`
    - Co-located Component (`.tsx`), Styles (`.module.css`), and Barrel (`index.ts`).
- **Modes**: Complex views (like `NameManagement`) are split into "Modes" (`TournamentMode`, `ProfileMode`) to separate concerns.

### 3. Store Slices
Global state in `useAppStore` is composed of focused slices:
- `tournamentSlice`: Active tournament data
- `userSlice`: Auth and profile
- `uiSlice`: Theme and view preferences
- `errorSlice`: Global error handling
- `siteSettingsSlice`: Remote config

## Directory Structure

```
src/
├── core/               # Global singletons (Store, API clients)
├── features/           # Domain-specific feature modules
│   └── tournament/     # Example feature
├── shared/             # Reusable UI, hooks, utils
│   ├── components/     # Atomic UI components
│   ├── hooks/          # Shared logic
│   └── styles/         # Global CSS & Tokens
├── types/              # TypeScript definitions
└── App.tsx             # Root component
```

## Key Components

- **NameManagementView**: The core interface for managing names. Acts as a router for `TournamentMode` and `ProfileMode`.
- **Tournament**: Handling of voting logic and tournament progression.
- **AnalysisDashboard**: Data visualization for name stats.
