import { Loading } from "../../../../shared/components/Loading";
import layoutStyles from "../../styles/Layout.module.css";

interface TournamentLoadingStateProps {
	visibleNamesCount: number;
	randomizedNamesCount: number;
}

export function TournamentLoadingState({
	visibleNamesCount,
	randomizedNamesCount,
}: TournamentLoadingStateProps) {
	return (
		<div className={layoutStyles.tournamentContainer}>
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
