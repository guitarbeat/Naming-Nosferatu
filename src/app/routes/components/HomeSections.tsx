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
			<section className="relative isolate flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden text-foreground px-6 text-center border-b border-border/40">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="flex flex-col items-center justify-center text-center max-w-4xl gap-8 md:gap-12"
				>
					<motion.p
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
						className="text-sm font-medium uppercase tracking-wider text-muted-foreground/70"
					>
						Help me choose
					</motion.p>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
					>
						<h1
							className={`${themeText.heroDisplay} tracking-tighter`}
							style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)", lineHeight: 1.05 }}
						>
							<HeroNameWords state={state} lockedNames={lockedNames} />
						</h1>
					</motion.div>

					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
						className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground/85 text-center max-w-2xl px-4"
						style={{ lineHeight: 1.4 }}
					>
						Vote on your favorite names and discover what your friends think too.
					</motion.h2>

					<motion.div
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
						className="mt-6"
					>
						<Button variant="glass" size="lg" onClick={onStartPicking}>
							Get Started
						</Button>
					</motion.div>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.6 }}
						transition={{ delay: 0.7, duration: 1, ease: "easeOut" }}
						className="mt-12 flex flex-col items-center gap-2 text-muted-foreground"
					>
						<motion.svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							animate={{ y: [0, 8, 0] }}
							transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
						>
							<polyline points="12 3 12 12 19 5" />
							<path d="M18 13H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z" />
						</motion.svg>
						<span className="text-xs font-medium">Scroll to continue</span>
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
							Pick at least 2 names to start comparing them.
						</p>
						<Button variant="glass" onClick={onGoToPicker}>
							← Back
						</Button>
					</div>
				)}
			</Suspense>
		</Section>
	);
}
