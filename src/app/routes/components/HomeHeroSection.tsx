import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
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
                <span className="relative inline-block">
                        <AnimatePresence mode="wait">
                                <motion.span
                                        key={displayNames[index]}
                                        className="inline-block font-black italic text-white"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.35, ease: "easeInOut" }}
                                >
                                        {displayNames[index]}
                                </motion.span>
                        </AnimatePresence>
                </span>
        );
}

export function HomeHeroSection({
        lockedNames,
}: HomeHeroSectionProps) {
        const candidateNames = lockedNames.map((n) => n.name);

        return (
                <section className="home-hero-section relative flex w-full items-center overflow-hidden border-b border-white/10">
                        <div className="home-hero-inner relative z-10 mx-auto w-full" style={{ mixBlendMode: "difference" }}>
                                <p className="text-xl font-medium text-white sm:text-2xl">
                                        My cat&apos;s name is
                                </p>
                                <h1 className="mt-1 font-display text-6xl leading-[1.0] text-white sm:text-8xl lg:text-[9rem]">
                                        <CyclingName names={candidateNames} />
                                </h1>
                        </div>
                </section>
        );
}
