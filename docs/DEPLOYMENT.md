# Deployment Guide

**Last Updated:** March 12, 2026

## Environment Variables

### Required Variables

| Variable | Purpose | Location |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Frontend |
| `DATABASE_URL` | PostgreSQL connection string | Backend/Drizzle |
| `ADMIN_API_KEY` | Secret key for admin API authentication | Backend |
| `CORS_ORIGIN` | Allowed CORS origin (defaults to localhost) | Backend |

### Example Configuration

```bash
VITE_SUPABASE_URL=https://ocghxwwwuubgmwsxgyoy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=postgresql://user:pass@host:5432/db
ADMIN_API_KEY=your_secret_key
CORS_ORIGIN=https://yourdomain.com
```

## Development Server

### Local Development

```bash
pnpm dev
```

This starts:
- Frontend: Vite dev server on port **5000** with HMR and polling-based file watching
- Backend: Express server on port **3001**, proxied from Vite via `/api` prefix

### Mock Mode

When `DATABASE_URL` is not set, the server falls back to mock data, allowing development without a database.

## Production Deployment

### Vercel (Recommended)

The application is configured for Vercel deployment:

- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Deployment Target**: Static
- **Branch**: Builds from `main` branch only

Configuration is in `vercel.json`.

### Build Process

```bash
pnpm run build    # Build for production
pnpm run preview  # Preview production build locally
```

## External Services

### Supabase

- **URL**: `ocghxwwwuubgmwsxgyoy.supabase.co`
- **Purpose**: PostgreSQL database and authentication provider
- **Access**: Via Supabase JS client (frontend) and Drizzle ORM (backend)

### Vercel Analytics

Client-side analytics via `@vercel/analytics/react` is integrated for production monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.
