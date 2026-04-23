import { type ComponentType, type LazyExoticComponent, Suspense, useEffect, useState } from "react";
import Button from "@/shared/components/layout/Button";
import { Loading } from "@/shared/components/layout/Feedback";
import { Section } from "@/shared/components/layout/Section";
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

function HeroNameMarquee({
        state,
        lockedNames,
}: {
        state: HomeHeroState;
        lockedNames: NameItem[];
}) {
        const names = lockedNames.map((item) => item.name);
        const [index, setIndex] = useState(0);

        useEffect(() => {
                if (names.length < 2) {
                        return;
                }
                const id = window.setInterval(() => {
                        setIndex((current) => (current + 1) % names.length);
                }, 2200);
                return () => window.clearInterval(id);
        }, [names.length]);

        useEffect(() => {
                if (index >= names.length) {
                        setIndex(0);
                }
        }, [index, names.length]);

        if (state === "loading") {
                return <span className="text-muted-foreground/70">…</span>;
        }
        if (state === "error" || names.length === 0) {
                return <span className="text-muted-foreground/70">Nosferatu</span>;
        }

        const current = names[index] ?? names[0];
        return (
                <span
                        key={current}
                        className="inline-block bg-gradient-to-r from-teal-300 via-sky-300 to-purple-300 bg-clip-text text-transparent animate-[fadeIn_300ms_ease-out]"
                >
                        {current}
                </span>
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
                                : "Pick. Lock. Bracket.";

        return (
                <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(48,120,138,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]">
                        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 py-10 text-center sm:px-6 sm:py-14 lg:gap-10">
                                <div className="mx-auto max-w-3xl space-y-4">
                                        <h1 className="font-display text-balance text-4xl leading-[0.95] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[4.5rem]">
                                                My cat's name is{" "}
                                                <HeroNameMarquee state={state} lockedNames={lockedNames} />
                                        </h1>
                                        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
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
                        maxWidth="full"
                        separator={true}
                >
                        <SectionHeading
                                title="Tournament Bracket"
                                subtitle="Run the bracket."
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
