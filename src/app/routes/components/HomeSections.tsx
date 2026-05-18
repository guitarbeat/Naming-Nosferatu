import { type ComponentType, type LazyExoticComponent, Suspense } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";
import { CinematicHero } from "@/shared/components/ui/CinematicHero";
import type { NameItem, RatingData } from "@/shared/types";

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
        state: HomeHeroState;
        lockedNames: NameItem[];
        onStartPicking: () => void;
        useCinematic?: boolean;
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

function HeroNameWords({
        state,
        lockedNames,
}: {
        state: HomeHeroState;
        lockedNames: NameItem[];
}) {
        if (state === "loading") {
                return <span className="text-white/20">________</span>;
        }
        if (state === "error" || lockedNames.length === 0) {
                return <span>Nosferatu</span>;
        }

        const words = [
                ...lockedNames.flatMap((n) => n.name.toUpperCase().split(/\s+/)),
                "WOODS",
        ];

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
        useCinematic = false,
}: HomeHeroSectionProps) {
        if (useCinematic) {
                return (
                        <CinematicHero
                                tagline1="Pick the perfect"
                                tagline2="name for your cat."
                                description="Run a tournament, gather opinions, and find the name that fits. Fair, visual, and surprisingly fun."
                                onCTA={onStartPicking}
                                ctaLabel="Start a tournament"
                                isScrollAnimated={true}
                        />
                );
        }

        return (
                <section className="relative isolate flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
                        <div aria-hidden="true" className="flex-[0.55]" />

                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/40">
                                My cat's name is
                        </p>

                        <h1
                                className="font-black uppercase leading-[0.88] tracking-tighter text-white"
                                style={{ fontSize: "clamp(2rem, 9vw, 8.5rem)" }}
                        >
                                <HeroNameWords state={state} lockedNames={lockedNames} />
                        </h1>

                        <div className="mt-10">
                                <Button variant="glass" size="xl" onClick={onStartPicking}>
                                        Wanna help me decide?
                                </Button>
                        </div>

                        <div aria-hidden="true" className="flex-1" />
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
                        <SectionHeading
                                title="Bracket"
                                subtitle="Head-to-head matchups."
                        />
                        <Suspense fallback={<Loading variant="skeleton" height={400} />}>
                                {names && names.length > 0 ? (
                                        <LazyTournament
                                                names={names}
                                                existingRatings={ratings}
                                                onComplete={onComplete}
                                        />
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
