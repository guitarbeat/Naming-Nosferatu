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
                <section className="relative isolate -mx-3 -mt-4 flex min-h-[100dvh] w-[calc(100%+1.5rem)] flex-col items-center overflow-x-clip px-4 text-center sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)] sm:px-8 md:-mt-10 md:px-12">
                        <div
                                className="pointer-events-none absolute inset-x-0 -z-10 top-0 bottom-0"
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

                        {/*
                         * Golden ratio vertical positioning.
                         * Spacer ratio 0.618 : 1 (above : below) positions the
                         * content block's top edge at the φ⁻¹ = 38.2% point of
                         * the remaining whitespace, placing the visual focus of
                         * the headline at approximately the upper golden section.
                         */}
                        <div aria-hidden="true" className="flex-[0.618]" style={{ minHeight: "3rem" }} />

                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/90 mix-blend-difference sm:text-sm">
                                My cat's name is
                        </p>

                        {/* Divider: mb = base × φ = 0.75 × 1.618 ≈ 1.25rem */}
                        <div className="mb-5 h-px w-14 bg-gradient-to-r from-transparent via-white/45 to-transparent mix-blend-difference sm:w-[3.5rem]" />

                        {/* H1: mt from divider already handled; next gap to button = 1.25 × φ ≈ 2rem */}
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
                                className="mt-14 sm:mt-16"
                        >
                                Wanna help me decide?
                        </Button>

                        {/* Remaining space: 1 part → total ratio above:below = 0.618:1 */}
                        <div aria-hidden="true" className="flex-1" style={{ minHeight: "5rem" }} />
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
