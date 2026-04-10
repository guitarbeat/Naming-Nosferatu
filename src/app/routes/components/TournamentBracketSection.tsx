import { type ComponentType, type LazyExoticComponent, Suspense } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { Trophy } from "@/shared/lib/icons";
import type { NameItem, RatingData } from "@/shared/types";

interface TournamentBracketSectionProps {
	LazyTournament: LazyExoticComponent<
		ComponentType<{
			names: NameItem[];
			existingRatings?: Record<string, RatingData>;
			onComplete: (ratings: Record<string, RatingData>) => void;
		}>
	>;
	names: NameItem[] | null | undefined;
	ratings: Record<string, RatingData>;
	onComplete: (ratings: Record<string, RatingData>) => void;
	onGoToPicker: () => void;
}

export function TournamentBracketSection({
	LazyTournament,
	names,
	ratings,
	onComplete,
	onGoToPicker,
}: TournamentBracketSectionProps) {
	return (
		<Section
			id="tournament"
			variant="minimal"
			padding="comfortable"
			maxWidth="full"
			separator={true}
		>
			<SectionHeading
				icon={Trophy}
				title="Tournament Bracket"
				subtitle="Head-to-head matchups, one winner at a time."
			/>
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				{names && names.length > 0 ? (
					<LazyTournament names={names} existingRatings={ratings} onComplete={onComplete} />
				) : (
					<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-6 text-center">
						<p className="text-pretty text-sm text-muted-foreground/70">
							Pick at least two names above to start the bracket.
						</p>
						<Button variant="glass" onClick={onGoToPicker}>
							Go to Picker
						</Button>
					</div>
				)}
			</Suspense>
		</Section>
	);
}
