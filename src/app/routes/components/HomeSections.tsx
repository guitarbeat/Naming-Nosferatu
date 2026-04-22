import { type ComponentType, type LazyExoticComponent, Suspense } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { BarChart3, Target, Trophy } from "@/shared/lib/icons";
import type { NameItem, RatingData } from "@/shared/types";

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
	state: HomeHeroState;
	lockedNames: NameItem[];
	selectedCount: number;
	totalNameCount: number | null;
	onStartPicking: () => void;
	onSeeResults: () => void;
}

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

function LockedNameSummary({
	state,
	lockedNames,
}: {
	state: HomeHeroState;
	lockedNames: NameItem[];
}) {
	const lockedPreview = lockedNames.slice(0, 4).map((name) => name.name);

	if (state === "loading") {
		return (
			<>
				<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
					Loading Shortlist
				</p>
				<p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">
					Fetching the current pool and locked names now so the homepage
					reflects live bracket data instead of a fake empty state.
				</p>
			</>
		);
	}

	if (state === "error") {
		return (
			<>
				<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
					Live Pool Unavailable
				</p>
				<p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">
					The current pool could not be loaded, so this section is waiting on
					fresh data instead of pretending there are zero locked names.
				</p>
			</>
		);
	}

	if (lockedPreview.length === 0) {
		return (
			<>
				<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
					Locked Names
				</p>
				<p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">
					No names are locked yet. Start in the picker to build a shortlist
					before you run the bracket.
				</p>
			</>
		);
	}

	return (
		<>
			<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
				Locked Names
			</p>
			<p className="max-w-xl text-sm leading-relaxed text-muted-foreground/80">
				These stay in every bracket run, so they shape both your session and
				the shared shortlist from the start.
			</p>
			<div className="flex flex-wrap gap-2 pt-1">
				{lockedPreview.map((name) => (
					<span
						key={name}
						className="rounded-full border border-border/70 px-3 py-1 text-sm font-medium text-foreground"
					>
						{name}
					</span>
				))}
				{lockedNames.length > lockedPreview.length && (
					<span className="rounded-full border border-border/60 px-3 py-1 text-sm text-muted-foreground">
						+{lockedNames.length - lockedPreview.length} more
					</span>
				)}
			</div>
		</>
	);
}

export function HomeHeroSection({
	state,
	lockedNames,
	selectedCount,
	totalNameCount,
	onStartPicking,
	onSeeResults,
}: HomeHeroSectionProps) {
	const isReady = state === "ready";
	const heroCopy =
		state === "loading"
			? "Fetching the live pool so the homepage reflects the current shortlist before you jump into the bracket."
			: state === "error"
				? "The live pool is temporarily unavailable, so the homepage is holding state instead of inventing counts or locked names."
				: "Pick favorites, keep must-have names visible, and move straight into the bracket without a giant splash screen in the way.";
	const heroStats = [
		{ icon: Target, label: "Selected", value: String(selectedCount) },
		{
			icon: Trophy,
			label: "Locked",
			value: isReady ? String(lockedNames.length) : "--",
		},
		{
			icon: BarChart3,
			label: "Pool",
			value: isReady && totalNameCount !== null ? String(totalNameCount) : "--",
		},
	] as const;

	return (
		<section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(48,120,138,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:gap-10">
				<div className="max-w-3xl space-y-4">
					<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/75">
						Naming Nosferatu
					</p>
					<h1 className="font-display text-balance text-4xl leading-[0.95] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[4.5rem]">
						Choose the shortlist. Run the bracket.
					</h1>
					<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
						{heroCopy}
					</p>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button
						variant="glass"
						size="xl"
						onClick={onStartPicking}
						className="w-full sm:w-auto"
					>
						Start Picking
					</Button>
					<Button
						variant="outline"
						size="xl"
						onClick={onSeeResults}
						className="w-full sm:w-auto"
					>
						See Results
					</Button>
				</div>

				<div className="grid gap-6 border-t border-border/60 pt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-start">
					<div className="space-y-3">
						<LockedNameSummary state={state} lockedNames={lockedNames} />
					</div>

					<dl className="grid grid-cols-3 gap-4">
						{heroStats.map(({ icon: Icon, label, value }) => (
							<div key={label} className="border-t border-border/60 pt-3">
								<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
									<Icon className="h-4 w-4" />
									<dt>{label}</dt>
								</div>
								<dd className="mt-2 text-2xl font-semibold leading-none text-foreground sm:text-3xl">
									{value}
								</dd>
							</div>
						))}
					</dl>
				</div>
			</div>
		</section>
	);
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
