import { lazy } from "react";

export { errorContexts } from "@/store/appStore";

// ═══════════════════════════════════════════════════════════════════════════════
// Lazy-Loaded Route Components
// ═══════════════════════════════════════════════════════════════════════════════

const TournamentFlow = lazy(() => import("@/features/tournament/modes/TournamentFlow"));

const DashboardLazy = lazy(() =>
	import("@/features/analytics/Dashboard").then((m) => ({
		default: m.Dashboard,
	})),
);

const AdminDashboardLazy = lazy(() =>
	import("@/features/admin/AdminDashboard").then((m) => ({
		default: m.AdminDashboard,
	})),
);

export const routeComponents = {
	TournamentFlow,
	DashboardLazy,
	AdminDashboardLazy,
} as const;
