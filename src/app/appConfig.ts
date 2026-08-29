import { Dashboard } from "@/features/dashboard/Dashboard";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";

export { errorContexts } from "@/store";

export const routeComponents = {
	TournamentSetup,
	DashboardLazy: Dashboard,
} as const;
