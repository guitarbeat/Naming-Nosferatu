# Name Nosferatu

## Project overview

Name Nosferatu is a React 19 + Vite application for tournament-style cat-name voting, results, suggestions, and analytics. It is a client-side app and publishes as static files from `dist`.

## Running on Replit

- The `Start application` workflow installs the locked dependencies and starts Vite on port 5000.
- The Replit publishing configuration builds with `pnpm run build` and serves the `dist` directory as a static deployment.
- Supabase credentials are optional for previewing the UI. Without them, the app starts in its unconfigured state and features that require persistence or authentication are unavailable.

## User preferences

- Keep the existing React/Vite/Tailwind structure.
- Prefer the smallest change that fixes the reported issue.