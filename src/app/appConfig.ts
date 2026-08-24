import { Dashboard } from "@/features/dashboard/DashboardViews";
import { TournamentSetup } from "@/features/tournament/TournamentSetup";

export { errorContexts } from "@/store/appStore";

export const routeComponents = {
	TournamentSetup,
	DashboardLazy: Dashboard,
} as const;
