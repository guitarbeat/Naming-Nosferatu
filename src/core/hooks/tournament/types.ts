import type { NameItem } from "../../../shared/propTypes";
import type { AppState } from "../../../types/store";

export interface UseTournamentProps {
	names?: NameItem[];
	existingRatings?: Record<
		string,
		{ rating: number; wins?: number; losses?: number }
	>;
	onComplete?: (
		results: Array<{
			name: string;
			id: string;
			rating: number;
			wins: number;
			losses: number;
		}>,
	) => void;
}

export interface UseTournamentHandlersProps {
	userName: string | null;
	tournamentActions: AppState["tournamentActions"];
	navigateTo: (path: string) => void;
}
