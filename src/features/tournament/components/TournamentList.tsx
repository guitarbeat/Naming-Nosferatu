import type React from "react";
import type { Tournament } from "../../../shared/services/tournament/TournamentService";

interface TournamentListProps {
	tournaments: Tournament[];
}

export const TournamentList: React.FC<TournamentListProps> = ({
	tournaments,
}) => {
	if (tournaments.length === 0) {
		return (
			<div className="empty-state">
				<p>No tournaments yet. Create your first tournament!</p>
			</div>
		);
	}

	return (
		<div className="tournament-list">
			{tournaments.map((tournament) => (
				<div key={tournament.id} className="tournament-card">
					<h3>{tournament.name}</h3>
					<p>{tournament.names.length} names</p>
					<p>Status: {tournament.isComplete ? "Complete" : "In Progress"}</p>
				</div>
			))}
		</div>
	);
};
