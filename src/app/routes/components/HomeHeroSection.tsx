import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
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

function CyclingName({ names }: { names: string[] }) {
        const displayNames = names.length > 0 ? names : ["Woods"];
        const [index, setIndex] = useState(0);

        useEffect(() => {
                if (displayNames.length <= 1) return;
                const id = setInterval(() => {
                        setIndex((i) => (i + 1) % displayNames.length);
                }, 2200);
                return () => clearInterval(id);
        }, [displayNames.length]);

        return (
                <span className="relative inline-block min-w-[6rem]">
                        <AnimatePresence mode="wait">
                                <motion.span
                                        key={displayNames[index]}
                                        className="gradient-heading inline-block font-black italic"
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -18 }}
                                        transition={{ duration: 0.32, ease: "easeInOut" }}
                                >
                                        {displayNames[index]}
                                </motion.span>
                        </AnimatePresence>
                </span>
        );
}

export function HomeHeroSection({
        lockedNames,
        selectedCount,
        totalNameCount,
        onStartPicking,
        onSeeResults,
}: HomeHeroSectionProps) {
        const heroImage = CAT_IMAGES[10] ?? CAT_IMAGES[0];
        const candidateNames = lockedNames.map((n) => n.name);

        return (
                <section className="home-hero-section relative isolate flex w-full overflow-hidden border-b border-white/10">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(39,135,153,0.2),transparent_38%),radial-gradient(circle_at_78%_18%,rgba(225,110,70,0.18),transparent_32%),linear-gradient(180deg,rgba(8,12,18,0.96),rgba(8,12,18,0.92))]" />

                        <div className="absolute inset-y-0 right-0 hidden w-[46%] min-w-[22rem] lg:block">
                                <CatImage
                                        src={heroImage}
                                        alt="Woods"
                                        containerClassName="h-full w-full"
                                        imageClassName="h-full w-full object-cover opacity-35"
                                />
                                <div className="absolute inset-0 bg-gradient-to-l from-slate-950/25 via-slate-950/55 to-slate-950" />
                        </div>

                        <div className="home-hero-inner relative z-10 mx-auto flex w-full flex-col justify-center gap-10">
                                <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/85">
                                        <PawPrint className="h-3.5 w-3.5" />
                                        Naming Nosferatu
                                </div>

                                <div className="max-w-2xl">
                                        <p className="text-lg font-medium text-white/60 sm:text-xl">
                                                My cat&apos;s name is
                                        </p>
                                        <h1 className="mt-2 font-display text-5xl leading-[1.05] text-white sm:text-7xl">
                                                <CyclingName names={candidateNames} />
                                        </h1>
                                        <p className="mt-6 max-w-md text-base leading-relaxed text-white/55">
                                                Help me pick the one that sticks. Run the bracket, vote on your favorites, and see what the crowd thinks too.
                                        </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
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

                                <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
                                        {[
                                                { label: "Names in play", value: totalNameCount },
                                                { label: "Finalists", value: lockedNames.length },
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
                </section>
        );
}
