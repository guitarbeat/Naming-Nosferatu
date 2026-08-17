# Fix backslashes in TournamentAnnouncements.tsx string literals using single quotes around INNER_EOF correctly this time
cat << 'INNER_EOF' > src/features/tournament/components/TournamentAnnouncements.tsx
import { memo } from "react";
import { type StreakBurst } from "../types/announcements";
import { OpeningBracketReveal } from "./announcements/OpeningBracketReveal";
import { RoundAnnouncement } from "./announcements/RoundAnnouncement";
import { StreakBurstAnnouncement } from "./announcements/StreakBurstAnnouncement";
import { VoteAnnouncement } from "./announcements/VoteAnnouncement";

interface TournamentAnnouncementsProps {
	prefersReducedMotion: boolean | null;
	openingBracketReveal: boolean;
	openingEntrants: Array<{ id: string; label: string }>;
	tournamentMode: string;
	totalRounds: number;
	voteAnnouncement: string | null;
	currentMatchKey: string;
	streakBurst: StreakBurst | null;
	roundAnnouncement: number | null;
}

// ⚡ Bolt Performance Optimization: Wrapped TournamentAnnouncements in React.memo()
// Prevents unnecessary re-renders of complex Framer Motion animations when parent tournament states
// (like timers or user input events) change without affecting announcement states.
export const TournamentAnnouncements = memo(function TournamentAnnouncements({
	prefersReducedMotion,
	openingBracketReveal,
	openingEntrants,
	tournamentMode,
	totalRounds,
	voteAnnouncement,
	currentMatchKey,
	streakBurst,
	roundAnnouncement,
}: TournamentAnnouncementsProps) {
	return (
		<>
			<div className="sr-only" aria-live="polite">
				{openingBracketReveal && "The bracket is set. First match begins now."}
				{roundAnnouncement !== null && `Round ${roundAnnouncement} begins.`}
				{voteAnnouncement && `${voteAnnouncement} advances.`}
				{streakBurst && `${streakBurst.winnerName} is on a ${streakBurst.streak} win streak.`}
			</div>

			<OpeningBracketReveal
				prefersReducedMotion={prefersReducedMotion}
				openingBracketReveal={openingBracketReveal}
				openingEntrants={openingEntrants}
				tournamentMode={tournamentMode}
				totalRounds={totalRounds}
			/>

			<VoteAnnouncement
				prefersReducedMotion={prefersReducedMotion}
				voteAnnouncement={voteAnnouncement}
				currentMatchKey={currentMatchKey}
			/>

			<StreakBurstAnnouncement
				prefersReducedMotion={prefersReducedMotion}
				streakBurst={streakBurst}
			/>

			<RoundAnnouncement
				prefersReducedMotion={prefersReducedMotion}
				roundAnnouncement={roundAnnouncement}
			/>
		</>
	);
});
INNER_EOF
