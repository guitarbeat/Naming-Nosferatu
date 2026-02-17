import Tournament from "@/features/tournament/Tournament";
import type { TournamentProps } from "@/types/appTypes";

export default function TournamentPlay({
	names,
	existingRatings,
	onComplete,
	userName,
	onVote,
}: TournamentProps) {
	return (
		<Tournament
			names={names}
			existingRatings={existingRatings}
			onComplete={onComplete}
			userName={userName}
			onVote={onVote}
		/>
	);
}
