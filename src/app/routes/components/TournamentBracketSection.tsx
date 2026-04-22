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
	const scopePanels = [
		{
			label: "Session Scope",
			description:
				"Each bracket run shapes your current ranking session, including the personal results panel and saved ordering you see later in the dashboard.",
		},
		{
			label: "Community Scope",
			description:
				"Leaderboard and site stats summarize broader activity across the whole app, so treat them as a wider signal rather than a mirror of a single bracket run.",
		},
	] as const;

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
				subtitle="Play through your live bracket here. This session sharpens your personal ordering while the wider site stats accumulate across everyone."
			/>
			<div className="mx-auto mb-5 w-full max-w-5xl overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm">
				<div className="grid gap-px bg-white/10 md:grid-cols-2">
					{scopePanels.map((panel) => (
						<div key={panel.label} className="bg-black/10 p-4 sm:p-5">
							<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
								{panel.label}
							</p>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">
								{panel.description}
							</p>
						</div>
					))}
				</div>
			</div>
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				{names && names.length > 0 ? (
					<LazyTournament
						names={names}
						existingRatings={ratings}
						onComplete={onComplete}
					/>
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
