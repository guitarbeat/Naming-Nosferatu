import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Button from "@/shared/components/layout/Button";
import CatImage from "@/shared/components/layout/CatImage";
import { CAT_IMAGES } from "@/shared/lib/constants";
import { PawPrint } from "@/shared/lib/icons";
import type { NameItem } from "@/shared/types";

interface HomeHeroSectionProps {
        lockedNames: NameItem[];
        selectedCount: number;
        totalNameCount: number;
        onStartPicking: () => void;
        onSeeResults: () => void;
}

type WordEntry = {
        word: string;
        name: NameItem | null;
};

function buildWordEntries(lockedNames: NameItem[]): WordEntry[] {
        if (lockedNames.length === 0) {
                return [];
        }

        return [
                ...lockedNames.flatMap((name) =>
                        name.name
                                .toUpperCase()
                                .split(/\s+/)
                                .map((word) => ({ word, name })),
                ),
                { word: "WOODS", name: null },
        ];
}

function HeroPreviewCard({ hoveredEntry }: { hoveredEntry: WordEntry | null }) {
        return (
                <div className="max-w-xl rounded-[1.75rem] border border-white/10 bg-black/35 p-4 backdrop-blur-lg sm:p-5">
                        <AnimatePresence mode="wait">
                                {hoveredEntry ? (
                                        hoveredEntry.name ? (
                                                <motion.div
                                                        key={hoveredEntry.name.name}
                                                        className="space-y-3"
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.18 }}
                                                >
                                                        <div className="flex flex-wrap items-center gap-2.5">
                                                                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                                                        Name
                                                                </span>
                                                                <span className="text-sm font-semibold text-white sm:text-base">
                                                                        {hoveredEntry.name.name}
                                                                </span>
                                                                <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-xs font-semibold text-primary">
                                                                        *{" "}
                                                                        {Math.round(hoveredEntry.name.avgRating ?? hoveredEntry.name.avg_rating ?? 1500)}
                                                                </span>
                                                        </div>

                                                        {(() => {
                                                                const wins = hoveredEntry.name.wins ?? 0;
                                                                const losses = hoveredEntry.name.losses ?? 0;
                                                                const total = wins + losses;
                                                                const winRate = total > 0 ? Math.round((wins / total) * 100) : null;

                                                                return total > 0 ? (
                                                                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/65">
                                                                                <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 font-medium text-emerald-300">
                                                                                        {wins} wins
                                                                                </span>
                                                                                <span className="rounded-full bg-rose-500/12 px-2.5 py-1 font-medium text-rose-300">
                                                                                        {losses} losses
                                                                                </span>
                                                                                {winRate !== null && <span>{winRate}% win rate</span>}
                                                                        </div>
                                                                ) : (
                                                                        <span className="text-xs text-white/45">No matches yet.</span>
                                                                );
                                                        })()}

                                                        {hoveredEntry.name.description && (
                                                                <p className="max-w-lg text-sm leading-relaxed text-white/65">
                                                                        {hoveredEntry.name.description}
                                                                </p>
                                                        )}
                                                </motion.div>
                                        ) : (
                                                <motion.p
                                                        key="woods"
                                                        className="text-sm leading-relaxed text-white/65"
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.18 }}
                                                >
                                                        Woods stays in the mix as the surname anchor while the bracket sorts out the first
                                                        name.
                                                </motion.p>
                                        )
                                ) : (
                                        <motion.div
                                                key="default"
                                                className="space-y-2"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.18 }}
                                        >
                                                <p className="text-sm font-medium text-white/85">
                                                        Tap, focus, or hover over a word to preview how it&apos;s performing.
                                                </p>
                                                <p className="text-sm leading-relaxed text-white/60">
                                                        Start in the picker, send your favorites into the tournament, and let the analysis
                                                        view show what keeps winning.
                                                </p>
                                        </motion.div>
                                )}
                        </AnimatePresence>
                </div>
        );
}

export function HomeHeroSection({
        lockedNames,
        selectedCount,
        totalNameCount,
        onStartPicking,
        onSeeResults,
}: HomeHeroSectionProps) {
        const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);
        const wordEntries = buildWordEntries(lockedNames);
        const hoveredEntry = activeWordIdx !== null ? (wordEntries[activeWordIdx] ?? null) : null;
        const heroImage = CAT_IMAGES[10] ?? CAT_IMAGES[0];
        const featuredImage = CAT_IMAGES[4] ?? CAT_IMAGES[0];

        return (
                <section className="home-hero-section relative isolate flex w-full overflow-hidden border-b border-white/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(39,135,153,0.2),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(225,110,70,0.18),transparent_32%),linear-gradient(180deg,rgba(8,12,18,0.96),rgba(8,12,18,0.92))]" />
                        <div className="absolute inset-y-0 right-0 hidden w-[42%] min-w-[22rem] lg:block">
                                <CatImage
                                        src={heroImage}
                                        alt="Woods"
                                        containerClassName="h-full w-full"
                                        imageClassName="h-full w-full object-cover opacity-35"
                                />
                                <div className="absolute inset-0 bg-gradient-to-l from-slate-950/25 via-slate-950/55 to-slate-950" />
                        </div>

                        <div className="home-hero-inner relative z-10 mx-auto grid w-full gap-12 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-end lg:gap-16">
                                <div className="home-hero-copy max-w-xl self-center">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/85">
                                                <PawPrint className="h-3.5 w-3.5" />
                                                Naming Nosferatu
                                        </div>

                                        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                                                Help choose Woods&apos;s forever name
                                        </p>
                                        <h1 className="mt-4 max-w-xl font-display text-4xl leading-[0.92] text-white sm:text-5xl">
                                                Run the bracket. Keep the chaos. Land on the name that sticks.
                                        </h1>
                                        <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
                                                Browse the shortlist, lock in your favorites, and see which names survive both your
                                                picks and the global leaderboard.
                                        </p>

                                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                                <Button size="large" className="min-w-[12rem]" onClick={onStartPicking}>
                                                        Start Picking
                                                </Button>
                                                <Button
                                                        variant="outline"
                                                        size="large"
                                                        className="min-w-[12rem] border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                                                        onClick={onSeeResults}
                                                >
                                                        See Results
                                                </Button>
                                        </div>

                                        <div className="home-hero-stats mt-8 grid grid-cols-3 gap-3 sm:max-w-lg">
                                                {[
                                                        { label: "Names in play", value: totalNameCount },
                                                        { label: "Locked finalists", value: lockedNames.length },
                                                        { label: "Your picks", value: selectedCount },
                                                ].map((item) => (
                                                        <div
                                                                key={item.label}
                                                                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-md"
                                                        >
                                                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                                                        {item.label}
                                                                </p>
                                                                <p className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{item.value}</p>
                                                        </div>
                                                ))}
                                        </div>
                                </div>

                                <div className="home-hero-preview relative flex items-end lg:min-h-[34rem]">
                                        <div className="absolute inset-0 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/55">
                                                <CatImage
                                                        src={featuredImage}
                                                        alt="Cat portrait"
                                                        containerClassName="h-full w-full"
                                                        imageClassName="h-full w-full object-cover opacity-75"
                                                />
                                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,16,0.18),rgba(7,10,16,0.82)),radial-gradient(circle_at_top_right,rgba(225,110,70,0.24),transparent_30%)]" />
                                        </div>

                                        <div className="relative z-10 flex w-full flex-col justify-end gap-6 p-5 sm:p-8 lg:p-10">
                                                <div className="space-y-3">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                                                                Current shortlist
                                                        </p>
                                                        <div
                                                                className="max-w-4xl font-black uppercase leading-[0.82] tracking-[-0.04em]"
                                                                style={{ fontSize: "clamp(2.35rem, 8vw, 7rem)" }}
                                                        >
                                                                {wordEntries.length > 0 ? (
                                                                        <span>
                                                                                {wordEntries.map(({ word }, index) => (
                                                                                        <motion.button
                                                                                                key={`${word}-${index}`}
                                                                                                type="button"
                                                                                                className="mr-3 inline-flex cursor-pointer items-center rounded-full border border-transparent px-1.5 py-1 last:mr-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                                                                                                onMouseEnter={() => setActiveWordIdx(index)}
                                                                                                onMouseLeave={() => setActiveWordIdx(null)}
                                                                                                onFocus={() => setActiveWordIdx(index)}
                                                                                                onBlur={() => setActiveWordIdx(null)}
                                                                                                onClick={() =>
                                                                                                        setActiveWordIdx((currentIdx) => (currentIdx === index ? null : index))
                                                                                                }
                                                                                                whileHover={{ filter: "brightness(1.22)" }}
                                                                                                transition={{ duration: 0.15 }}
                                                                                        >
                                                                                                <span
                                                                                                        className={`gradient-heading transition-opacity duration-200 ${
                                                                                                                activeWordIdx === index ? "opacity-100" : "opacity-82"
                                                                                                        }`}
                                                                                                >
                                                                                                        {word}
                                                                                                </span>
                                                                                        </motion.button>
                                                                                ))}
                                                                        </span>
                                                                ) : (
                                                                        <span className="text-white/15">Woods</span>
                                                                )}
                                                        </div>
                                                </div>

                                                <HeroPreviewCard hoveredEntry={hoveredEntry} />
                                        </div>
                                </div>
                        </div>
                </section>
        );
}
