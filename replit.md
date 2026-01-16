# Name Nosferatu

A React application for helping name cats through tournament-style voting. Users can vote between cat names to determine favorites, view analytics, and explore name options.

## Overview
- **Framework**: React 19 with Vite 7
- **Styling**: TailwindCSS 4
- **State Management**: Zustand, React Query (TanStack)
- **Backend**: Supabase (external)
- **Package Manager**: pnpm

## Project Structure
- `source/` - Main application source code
  - `App.tsx` - Root application component
  - `main.tsx` - Application entry point
  - `core/` - Core hooks and utilities
  - `features/` - Feature modules (tournament, analytics, gallery, etc.)
  - `shared/` - Shared components, services, styles, and utilities
  - `types/` - TypeScript type definitions
- `config/` - Build and tool configurations
- `public/` - Static assets
- `docs/` - Documentation

## Development
Run `pnpm run dev` to start the development server on port 5000.

## Build
Run `pnpm run build` to build for production. Output is in the `dist/` folder.

## Deployment
Configured for static deployment. The build output (`dist/`) contains all static files to be served.

## Recent Changes
- 2026-01-16: Initial Replit environment setup, configured Vite for port 5000 with HMR support for Replit proxy
