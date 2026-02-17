# Sentinel's Journal

## 2025-05-23 - Unprotected "Dead" API Endpoints
**Vulnerability:** Several `DELETE` and `PATCH` endpoints in `server/routes.ts` were completely public, allowing anyone to delete or modify data. These endpoints appeared to be unused by the current frontend code ("dead code").
**Learning:** Developers often leave "admin" or "test" endpoints in the backend code without adding authentication, assuming obscurity (no frontend links) provides security.
**Prevention:**
1. Adopt a "secure by default" approach: Apply a global authentication middleware and whitelist public routes, rather than adding auth to specific routes.
2. regularly audit backend routes against frontend usage.
3. If an endpoint is for admin use, it MUST have authentication, even if it's "internal".
