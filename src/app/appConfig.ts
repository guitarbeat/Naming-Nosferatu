import { Dashboard } from "@/features/dashboard/DashboardViews";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";

export { errorContexts } from "@/store";

export const routeComponents = {
	TournamentSetup,
	DashboardLazy: Dashboard,
} as const;
