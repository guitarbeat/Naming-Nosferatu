## 2025-05-23 - Auth Bypass via Client-Side User Context
**Vulnerability:** The application relies on `localStorage` to store the username, which is then passed to the `set_user_context` RPC. This RPC sets a session variable that the database uses for `is_admin()` checks.
**Learning:** This architecture allows any user to impersonate any other user (including admins) by simply modifying their `localStorage` key `user_name`. The backend blindly trusts the client-provided username via `set_user_context`.
**Prevention:** Authentication should rely on a secure, tamper-proof mechanism like JWTs (Supabase Auth) where the user identity is verified by the auth service, not provided by the client as a plain string parameter.

## 2025-05-23 - CSV Formula Injection
**Vulnerability:** The CSV export functionality did not sanitize user input, allowing potential Formula Injection (CSV Injection) if a name started with `=, +, -, @`.
**Learning:** Even simple exports like CSV can be vectors for attacks if they are opened in spreadsheet software that executes formulas.
**Prevention:** Always sanitize CSV fields by escaping quotes and prepending a single quote to potential formula triggers.
