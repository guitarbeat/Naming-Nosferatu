import { Loading } from "../../../shared/components/Loading";
import tournamentStyles from "../styles/Tournament.module.css";

interface TournamentLoadingStateProps {
	visibleNamesCount: number;
	randomizedNamesCount: number;
}

export function TournamentLoadingState({
	visibleNamesCount,
	randomizedNamesCount,
}: TournamentLoadingStateProps) {
	return (
		<div className={tournamentStyles.tournament}>
			<Loading variant="spinner" />
			<p style={{ textAlign: "center", marginTop: "1rem" }}>
				{visibleNamesCount
					? randomizedNamesCount
						? "Preparing tournament..."
						: "Setting up tournament..."
					: "No visible names available. Please check your filters or try again."}
			</p>
		</div>
	);
}
