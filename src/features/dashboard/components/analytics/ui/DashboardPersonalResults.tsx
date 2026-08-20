import { Trophy } from "lucide-react";
import { memo } from "react";
import type { NameItem, RatingData } from "@/shared/types";
import { ContextBadge, Panel, SectionHeader } from "../components/DashboardPrimitives";
import { PersonalResults } from "../PersonalResults";

interface DashboardPersonalResultsProps {
	personalRatings?: Record<string, RatingData>;
	currentTournamentNames?: NameItem[];
	onStartNew: () => void;
	onUpdateRatings: (
		ratings:
			| Record<string, RatingData>
			| ((prev: Record<string, RatingData>) => Record<string, RatingData>),
	) => void;
	userName: string;
}

export const DashboardPersonalResults = memo(function DashboardPersonalResults({
	personalRatings,
	currentTournamentNames,
	onStartNew,
	onUpdateRatings,
	userName,
}: DashboardPersonalResultsProps) {
	if (!personalRatings || Object.keys(personalRatings).length === 0) {
		return null;
	}

	return (
		<Panel>
			<SectionHeader
				icon={Trophy}
				title="Your Rankings"
				subtitle="Your saved order."
				action={<ContextBadge label="Personal" tone="accent" />}
			/>
			<PersonalResults
				personalRatings={personalRatings}
				currentTournamentNames={currentTournamentNames}
				onStartNew={onStartNew}
				onUpdateRatings={onUpdateRatings}
				userName={userName}
			/>
		</Panel>
	);
});
