## 2025-05-23 - CSV Injection Vulnerability
**Vulnerability:** The CSV export function (`exportTournamentResultsToCSV`) was vulnerable to Formula Injection (CSV Injection) and failed to escape double quotes correctly.
**Learning:** Manual CSV string concatenation is error-prone. Standard CSV sanitization (escaping quotes, preventing formula execution) is often overlooked in custom implementations.
**Prevention:** Always use a dedicated CSV generation library or a robust helper function that handles escaping (doubling quotes) and sanitization (prepending `'` to dangerous prefixes like `=`, `+`, `-`, `@`).
