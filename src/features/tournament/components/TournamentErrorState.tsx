import errorStyles from "../styles/Error.module.css";

export function TournamentErrorState() {
	return (
		<div className={errorStyles.errorContainer}>
			<h3>Tournament Error</h3>
			<p>Something went wrong with the tournament. Please try restarting it.</p>
			<button onClick={() => window.location.reload()} className={errorStyles.retryButton}>
				Restart Tournament
			</button>
		</div>
	);
}
