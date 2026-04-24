import { type ComponentType, type LazyExoticComponent, Suspense } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";
import { Surface } from "@/shared/components/layout/Surface";
import { SectionHeading } from "@/shared/components/layout/SectionHeading";
import type { NameItem, RatingData } from "@/shared/types";

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
        state: HomeHeroState;
        lockedNames: NameItem[];
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

const HEADING_CLS =
        "font-bold text-balance text-white uppercase tracking-tighter";

function HeroNameWords({
        state,
        lockedNames,
}: {
        state: HomeHeroState;
        lockedNames: NameItem[];
}) {
        if (state === "loading") {
                return <span className="text-white/40">________</span>;
        }
        if (state === "error" || lockedNames.length === 0) {
                return <span className={HEADING_CLS}>Nosferatu</span>;
        }

        const words = [
                ...lockedNames.flatMap((n) => n.name.toUpperCase().split(/\s+/)),
                "WOODS",
        ];

        return (
                <span>
                        {words.map((word, i) => (
                                <span key={`${word}-${i}`} className="block sm:inline-block">
                                        <span className={HEADING_CLS}>
                                                {i < words.length - 1 ? `${word}\u00a0` : word}
                                        </span>
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
        return (
                <section className="relative isolate -mx-3 -mt-4 flex min-h-[100dvh] w-[calc(100%+1.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)] sm:px-8 md:-mt-10 md:px-12">
                        <div
                                className="pointer-events-none absolute inset-0 -z-10"
                                aria-hidden="true"
                        >
                                <div className="absolute left-1/4 top-1/3 h-[60vw] w-[60vw] max-h-[600px] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 blur-[120px]" />
                                <div className="absolute right-1/4 bottom-1/3 h-[55vw] w-[55vw] max-h-[550px] max-w-[550px] translate-x-1/2 translate-y-1/2 rounded-full bg-accent/40 blur-[120px]" />
                        </div>

                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white mix-blend-difference sm:mb-5 sm:text-base md:text-lg">
                                My cat's name is
                        </p>

                        <div className="mb-3 h-px w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent mix-blend-difference sm:mb-6 sm:w-16" />

                        <h1
                                className="max-w-full font-black uppercase leading-[0.85] tracking-tighter mix-blend-difference"
                                style={{ fontSize: "clamp(1.75rem, 9vw, 9rem)" }}
                        >
                                <HeroNameWords state={state} lockedNames={lockedNames} />
                        </h1>

                        <Button
                                variant="glass"
                                size="xl"
                                onClick={onStartPicking}
                                className="mt-10 sm:mt-14"
                        >
                                Wanna help me decide?
                        </Button>
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
                { label: "Session", description: "Your personal ranking." },
                { label: "Community", description: "Aggregate site stats." },
        ] as const;

        return (
                <Section
                        id="tournament"
                        variant="minimal"
                        padding="comfortable"
                        maxWidth="2xl"

                        separator={true}
                >
                        <SectionHeading
                                title="Tournament Bracket"
                                subtitle="Run the bracket."
                        />
                        <div className="mx-auto mb-6 grid w-full max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
                                {scopePanels.map((panel) => (
                                        <Surface
                                                key={panel.label}
                                                radius="md"
                                                padding="compact"
                                                className="text-center sm:text-left"
                                        >
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
                                                        {panel.label}
                                                </p>
                                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">
                                                        {panel.description}
                                                </p>
                                        </Surface>
                                ))}
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
