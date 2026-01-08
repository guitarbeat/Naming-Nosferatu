# Name Nosferatu

A React application for managing cat names with tournament-style voting, built with Vite and Supabase.

## Overview
- **Purpose**: Cat name management and tournament voting application
- **Stack**: React 19, Vite 7, TypeScript, Tailwind CSS, Supabase
- **State Management**: Zustand, React Query

## Project Structure
```
src/
  App.tsx         - Main application component
  main.tsx        - Entry point
  core/           - Core hooks and utilities
  features/       - Feature-specific components
  shared/         - Shared components, services, utils, styles
  types/          - TypeScript type definitions
  integrations/   - Third-party integrations (Supabase)
config/           - Build and linting configurations
public/           - Static assets
```

## Development

### Running the App
```bash
npm run dev          # Start development server on port 5000
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

### Environment Variables
Required Supabase credentials:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Deployment
- Deployment target: Static
- Build command: `npm run build`
- Output directory: `dist`
