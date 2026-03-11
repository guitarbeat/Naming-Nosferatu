# Analytics & Admin System Review

## Snapshot

This review reflects the current codebase after the recent admin dashboard, analytics wiring, lint cleanup, and dependency-security passes.

## Current State

### Analytics Dashboard (`src/features/analytics/Dashboard.tsx`)

**Status**: Functional

**What exists**
- Global leaderboard rendering using `leaderboardAPI.getLeaderboard()`
- Per-user stats using `statsAPI.getUserStats()`
- Site statistics using `statsAPI.getSiteStats()`
- Hidden-name management panel for admins
- Random generator and personal-results integration

**Current limits**
- No ranking-history chart or timeline view
- No popularity trend visualization beyond ranked lists
- No tournament-history panel
- Admin-only actions in the main analytics dashboard are still narrower than the dedicated admin page

### Analytics Service (`src/services/analytics/analyticsService.ts`)

**Status**: Good

**What exists**
- Normalized mapping for both snake_case and camelCase leaderboard payloads
- `leaderboardAPI`, `analyticsAPI`, and `statsAPI`
- Popularity-score client for admin and dashboard surfaces
- Tests covering leaderboard and popularity mapping

**Current limits**
- No dedicated ranking-history client yet
- No richer typed models for time-series analytics

### Admin Dashboard (`src/features/admin/AdminDashboard.tsx`)

**Status**: Functional but incomplete

**What exists**
- Overview, names, users, and analytics tabs with live data
- Bulk hide/unhide and lock/unlock actions
- Derived operational metrics such as ratings-per-user and hidden/locked share
- Leaderboard and popularity snapshots
- Signed-in admin activity summary

**Current limits**
- No user-management tools
- No audit-log view
- No activity stream beyond derived snapshots
- No write-path confirmation or toast feedback for admin actions

### Admin Identity / Authorization

**Status**: Still partial

**What exists**
- `isAdmin` state is passed through the app and gates `/admin`
- Components can branch on admin state cleanly

**Current limits**
- `checkAdminStatus()` is still not backed by a real database role lookup
- No grant/revoke workflow
- No explicit role-management UI

## Resolved Since The Previous Review

- `App.tsx` now passes `isAdmin` into the analytics dashboard
- The analytics dashboard is no longer a placeholder surface
- Hidden-name controls now have working UI
- The admin dashboard is no longer mostly "coming soon"
- Security overrides now clear local production audit findings
- Repo lint and test baselines are green locally

## Highest-Value Remaining Work

### Priority 1: Real Admin Role Detection

Implement a database-backed `checkAdminStatus()` path and initialize admin state from the authenticated user record.

### Priority 2: Admin Auditability

Add an audit log for hide/unhide and lock/unlock actions, then expose it in the admin dashboard.

### Priority 3: Analytics Depth

Add one genuinely new analytic surface instead of more summary cards:
- ranking-history timeline
- popularity trend chart
- tournament activity history

### Priority 4: Admin UX Hardening

Add action feedback and error handling:
- success/error toasts
- optimistic or disabled button states during writes
- clearer empty/loading/error states per panel

## Suggested Next Epochs

1. Back `checkAdminStatus()` with Supabase user-role data and persist the resolved role in app state.
2. Add admin action toasts and pending-state handling to hide/lock operations.
3. Add one time-series analytics endpoint and render it in the admin analytics tab.
