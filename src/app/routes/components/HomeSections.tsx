import { type ComponentType, type LazyExoticComponent, Suspense } from "react";
import { motion } from "framer-motion";
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
                                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
                                aria-hidden="true"
                        >
                                <motion.div
                                        className="absolute h-[70vw] w-[70vw] max-h-[700px] max-w-[700px] rounded-full bg-primary blur-[120px] opacity-70"
                                        animate={{
                                                x: ["-20%", "60%", "10%", "-20%"],
                                                y: ["-10%", "30%", "60%", "-10%"],
                                        }}
                                        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.div
                                        className="absolute right-0 bottom-0 h-[65vw] w-[65vw] max-h-[650px] max-w-[650px] rounded-full bg-accent blur-[120px] opacity-70"
                                        animate={{
                                                x: ["10%", "-50%", "0%", "10%"],
                                                y: ["10%", "-40%", "20%", "10%"],
                                        }}
                                        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
                                />
                                <motion.div
                                        className="absolute left-1/2 top-1/2 h-[55vw] w-[55vw] max-h-[550px] max-w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary blur-[120px] opacity-60"
                                        animate={{
                                                x: ["-30%", "30%", "-10%", "-30%"],
                                                y: ["20%", "-20%", "40%", "20%"],
                                        }}
                                        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                                />
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
