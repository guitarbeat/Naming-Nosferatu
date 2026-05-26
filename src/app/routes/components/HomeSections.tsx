import { motion } from "framer-motion";
import { type ComponentType, type LazyExoticComponent, Suspense } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { Section } from "@/shared/components/layout/Section";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import { themeText } from "@/shared/lib/themeClasses";
import type { NameItem, RatingData } from "@/shared/types";

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
	state: HomeHeroState;
	lockedNames: NameItem[];
	onStartPicking: () => void;
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

function HeroNameWords({ state, lockedNames }: { state: HomeHeroState; lockedNames: NameItem[] }) {
	if (state === "loading") {
		return <span className={themeText.heroPlaceholder}>________</span>;
	}
	if (state === "error" || lockedNames.length === 0) {
		return <span>Nosferatu</span>;
	}

	const words = [...lockedNames.flatMap((n) => n.name.toUpperCase().split(/\s+/)), "WOODS"];

	return (
		<span>
			{words.map((word, i) => (
				<span key={`${word}-${i}`} className="block sm:inline-block">
					{i < words.length - 1 ? `${word}\u00a0` : word}
				</span>
			))}
		</span>
	);
}

export function HomeHeroSection({ state, lockedNames, onStartPicking }: HomeHeroSectionProps) {
	return (
		<div className="home-hero-wrapper w-full">
			<section className="relative isolate flex min-h-[45dvh] sm:min-h-[50dvh] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground px-6 text-center py-12 md:py-16 border-b border-border/40">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="flex flex-col items-center justify-center text-center max-w-4xl"
				>
					<p className={`mb-3 ${themeText.eyebrowWide}`}>My cat's name is</p>
					<h1
						className={`${themeText.heroDisplay} mb-6 tracking-tighter`}
						style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)", lineHeight: 1.05 }}
					>
						<HeroNameWords state={state} lockedNames={lockedNames} />
					</h1>

					<motion.h2
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.6 }}
						className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight bg-gradient-to-r from-stardust via-hot-pink to-accent bg-clip-text text-transparent mb-6 text-center max-w-2xl px-4"
						style={{ lineHeight: 1.2 }}
					>
						Run a tournament, gather opinions, and find the name that fits.
					</motion.h2>

					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.4, duration: 0.4 }}
					>
						<Button variant="glass" size="lg" onClick={onStartPicking}>
							Narrow It Down
						</Button>
					</motion.div>
				</motion.div>
			</section>
		</div>
	);
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
			maxWidth="2xl"
			separator={true}
		>
			<SectionHeading title="Bracket" subtitle="Head-to-head matchups." />
			<Suspense fallback={<Loading variant="skeleton" height={400} />}>
				{names && names.length > 0 ? (
					<LazyTournament names={names} existingRatings={ratings} onComplete={onComplete} />
				) : (
					<div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-12 text-center">
						<p className="text-pretty text-sm text-muted-foreground/70">
							Select at least two names to begin.
						</p>
						<Button variant="glass" onClick={onGoToPicker}>
							Go Back
						</Button>
					</div>
				)}
			</Suspense>
		</Section>
	);
}
