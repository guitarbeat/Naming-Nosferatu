# Name Nosferatu

A React application for helping name cats through tournament-style voting. Users can vote between cat names to determine favorites, view analytics, and explore name options.

## Overview
- **Framework**: React 19 with Vite 7
- **Styling**: TailwindCSS 4, HeroUI components
- **State Management**: Zustand, React Query (TanStack)
- **Backend**: Supabase (external)
- **Package Manager**: pnpm

## Project Structure
- `source/` - Main application source code
  - `App.tsx` - Root application component
  - `main.tsx` - Application entry point
  - `components/` - Shared UI components
  - `features/` - Feature modules (tournament, analytics, auth, etc.)
  - `hooks/` - Custom React hooks
  - `providers/` - Context providers
  - `services/` - API services
  - `store/` - Zustand state management
  - `styles/` - CSS styles
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
- `supabase/` - Supabase client configuration and types
- `config/` - Build and tool configurations
- `public/` - Static assets

## Development
Run `pnpm run dev` to start the development server on port 5000.

## Build
Run `pnpm run build` to build for production. Output is in the `dist/` folder.

## Deployment
Configured for static deployment. The build output (`dist/`) contains all static files to be served.

## Environment Variables
The app requires Supabase configuration:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Recent Changes
- 2026-01-24: Fixed vite.config.ts duplicate code issue, updated path aliases to match current project structure, added @heroui/react dependency, configured Replit environment
