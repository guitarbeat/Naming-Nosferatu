import { lazy } from "react";

export { errorContexts } from "@/store/appStore";

// ═══════════════════════════════════════════════════════════════════════════════
// Lazy-Loaded Route Components
// ═══════════════════════════════════════════════════════════════════════════════

const TournamentFlow = lazy(() => import("@/features/tournament/modes/TournamentFlow"));

const DashboardLazy = lazy(() =>
	import("@/features/dashboard/Dashboard").then((m) => ({
		default: m.Dashboard,
	})),
);

export const routeComponents = {
	TournamentFlow,
	DashboardLazy,
} as const;
