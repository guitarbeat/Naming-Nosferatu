/**
 * @module appConfig
 * @description Centralized configuration for app routes and layout settings.
 * This consolidates route definitions and layout configuration that was previously
 * scattered across App.tsx, routes.tsx, and AppLayout.tsx.
 */

import { lazy } from "react";

/* Lazy-loaded route components for code splitting */
const TournamentFlow = lazy(() => import("@/features/tournament/modes/TournamentFlow"));
const DashboardLazy = lazy(() =>
	import("@/features/analytics/Dashboard").then((m) => ({ default: m.Dashboard })),
);

/** Route configuration with metadata */
export const routes = {
	home: {
		path: "/",
		label: "Tournament",
	},
	analysis: {
		path: "/analysis",
		label: "Analytics",
	},
} as const;

/** Component padding and layout constants */
export const layoutConfig = {
	contentPadding: "max(8rem,calc(120px+env(safe-area-inset-bottom)))",
	contentGap: "gap-8",
	contentFlex: "flex flex-col",
} as const;

/** Lazy-loaded components for routes */
export const routeComponents = {
	TournamentFlow,
	DashboardLazy,
} as const;

/** Error context labels for ErrorBoundary */
export const errorContexts = {
	tournamentFlow: "Tournament Flow",
	analysisDashboard: "Analysis Dashboard",
	mainLayout: "Main Application Layout",
} as const;

export type RouteKey = keyof typeof routes;
