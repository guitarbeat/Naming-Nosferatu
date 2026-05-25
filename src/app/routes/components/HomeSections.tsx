import { type ComponentType, type LazyExoticComponent, Suspense, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

export function HomeHeroSection({
	state,
	lockedNames,
	onStartPicking,
}: HomeHeroSectionProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLDivElement>(null);
	const ctaRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			gsap.registerPlugin(ScrollTrigger);
		}

		const ctx = gsap.context(() => {
			gsap.set(ctaRef.current, { autoAlpha: 0, y: 50, pointerEvents: "none" });

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: containerRef.current,
					start: "top top",
					end: "+=1200",
					pin: true,
					scrub: 1,
					anticipatePin: 1,
				},
			});

			tl.to(textRef.current, {
				scale: 1.2,
				autoAlpha: 0,
				filter: "blur(10px)",
				duration: 1,
				ease: "power2.inOut",
			})
			.to(
				ctaRef.current,
				{
					autoAlpha: 1,
					y: 0,
					pointerEvents: "auto",
					duration: 1,
					ease: "power2.out",
				},
				"-=0.5"
			)
			.to({}, { duration: 0.5 });
		}, containerRef);

		return () => ctx.revert();
	}, []);

	return (
		<section ref={containerRef} className="relative isolate flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground px-6 text-center">
			<div ref={textRef} className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 w-full">
				<p className={`mb-4 ${themeText.eyebrowWide}`}>My cat's name is</p>
				<h1 className={themeText.heroDisplay} style={{ fontSize: "clamp(2rem, 9vw, 8.5rem)" }}>
					<HeroNameWords state={state} lockedNames={lockedNames} />
				</h1>
			</div>

			<div ref={ctaRef} className="absolute inset-0 flex flex-col items-center justify-center z-20 w-full px-4">
				<h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter bg-gradient-to-r from-stardust to-hot-pink bg-clip-text text-transparent mb-8 text-center max-w-4xl" style={{ lineHeight: 1.1 }}>
					Run a tournament, gather opinions, and find the name that fits.
				</h2>
				<Button variant="glass" size="xl" onClick={onStartPicking}>
					Start a tournament
				</Button>
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
