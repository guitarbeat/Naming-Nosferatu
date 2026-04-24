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

const HERO_NAME_COLORS = [
        "#3FB8B0",
        "#E5764A",
        "#D4B483",
        "#5BA8E8",
        "#9F7AEA",
        "#E26E9D",
];

function HeroNameMarquee({
        state,
        lockedNames,
}: {
        state: HomeHeroState;
        lockedNames: NameItem[];
}) {
        const names = lockedNames.map((item) => item.name);

        if (state === "loading") {
                return <span className="text-muted-foreground/60">…</span>;
        }
        if (state === "error" || names.length === 0) {
                return <span className="text-muted-foreground/60">Nosferatu</span>;
        }

        return (
                <>
                        {names.map((name, i) => (
                                <span
                                        key={`${name}-${i}`}
                                        style={{ color: HERO_NAME_COLORS[i % HERO_NAME_COLORS.length] }}
                                        className="mx-[0.35em] inline-block"
                                >
                                        {name}
                                </span>
                        ))}
                </>
        );
}

export function HomeHeroSection({
        state,
        lockedNames,
        onStartPicking,
        onSeeResults,
}: HomeHeroSectionProps) {
        const heroCopy =
                state === "loading"
                        ? "Loading shortlist…"
                        : state === "error"
                                ? "Live pool unavailable."
                                : "I'm indecisive — scroll down, pick your favorites, and help me decide!";

        return (
                <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden border-b border-border/60 bg-background bg-[radial-gradient(circle_at_top_left,rgba(48,120,138,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(229,118,74,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]">
                        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 text-center sm:px-10 lg:gap-12">
                                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white mix-blend-difference sm:text-sm">
                                        My cat's name is
                                </p>
                                <h1 className="font-display text-balance text-5xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-foreground sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7.5rem]">
                                        <HeroNameMarquee state={state} lockedNames={lockedNames} />
                                </h1>
                                <Button
                                        variant="glass"
                                        size="xl"
                                        onClick={onStartPicking}
                                        className="mt-2"
                                >
                                        Wanna help me decide?
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
