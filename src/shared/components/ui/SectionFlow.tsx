import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useCallback, useState } from "react";

type Section = "hero" | "pick" | "tournament" | "analysis";

interface SectionFlowProps {
	sections: {
		hero: ReactNode;
		pick: ReactNode;
		tournament: ReactNode;
		analysis: ReactNode;
	};
	onSectionChange?: (section: Section) => void;
}

const SECTIONS: Section[] = ["hero", "pick", "tournament", "analysis"];
const SECTION_ORDER: Record<Section, number> = {
	hero: 0,
	pick: 1,
	tournament: 2,
	analysis: 3,
};

const SECTION_LABELS: Record<Section, string> = {
	hero: "Start",
	pick: "Pick",
	tournament: "Battle",
	analysis: "Results",
};

export function SectionFlow({ sections, onSectionChange }: SectionFlowProps) {
	const [current, setCurrent] = useState<Section>("hero");
	const [direction, setDirection] = useState(0);
	const currentIndex = SECTION_ORDER[current];

	const navigate = useCallback(
		(target: Section) => {
			const targetIndex = SECTION_ORDER[target];
			setDirection(targetIndex > currentIndex ? 1 : -1);
			setCurrent(target);
			onSectionChange?.(target);
		},
		[currentIndex, onSectionChange],
	);

	const next = useCallback(() => {
		const nextSection = SECTIONS[Math.min(currentIndex + 1, SECTIONS.length - 1)];
		navigate(nextSection);
	}, [currentIndex, navigate]);

	const prev = useCallback(() => {
		const prevSection = SECTIONS[Math.max(currentIndex - 1, 0)];
		navigate(prevSection);
	}, [currentIndex, navigate]);

	const handleSwipe = (e: React.TouchEvent<HTMLDivElement>) => {
		const touch = e.changedTouches[0];
		if (!touch) {
			return;
		}
		const delta = touch.clientX - (e.currentTarget._startX ?? touch.clientX);
		if (Math.abs(delta) > 50) {
			delta > 0 ? prev() : next();
		}
	};

	return (
		<motion.div
			key={current}
			initial={{ opacity: 0, x: direction * 50 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -direction * 50 }}
			transition={{ duration: 0.4, ease: "easeInOut" }}
			className="w-full"
			onTouchStart={(e) => {
				(e.currentTarget as any)._startX = e.touches[0].clientX;
			}}
			onTouchEnd={handleSwipe}
		>
			<div
				data-section={current}
				className="w-full"
				onKeyDown={(e) => {
					if (e.key === "ArrowRight" || e.key === "l") {
						next();
					}
					if (e.key === "ArrowLeft" || e.key === "h") {
						prev();
					}
				}}
				role="region"
				aria-label={`Section: ${current}`}
			>
				{sections[current]}
			</div>

			<MagneticNav
				current={current}
				canGoPrev={currentIndex > 0}
				canGoNext={currentIndex < SECTIONS.length - 1}
				onNext={next}
				onPrev={prev}
				onNavigate={navigate}
			/>
		</motion.div>
	);
}

interface MagneticNavProps {
	current: Section;
	canGoPrev: boolean;
	canGoNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	onNavigate: (section: Section) => void;
}

function MagneticNav({
	current,
	canGoPrev,
	canGoNext,
	onPrev,
	onNext,
	onNavigate,
}: MagneticNavProps) {
	const [hover, setHover] = useState<Section | null>(null);

	return (
		<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
			<motion.div
				className="flex items-center gap-6 px-8 py-3 rounded-full bg-black/50 backdrop-blur-lg border border-white/10 shadow-2xl"
				layout={true}
			>
				<motion.button
					onClick={onPrev}
					disabled={!canGoPrev}
					whileHover={{ scale: canGoPrev ? 1.15 : 1 }}
					whileTap={{ scale: canGoPrev ? 0.9 : 1 }}
					className="px-2 text-sm font-medium text-white/60 disabled:opacity-20 hover:text-white transition-colors cursor-pointer"
					aria-label="Previous section"
				>
					←
				</motion.button>

				<div className="flex gap-4 px-4">
					<AnimatePresence mode="wait">
						{(["hero", "pick", "tournament", "analysis"] as Section[]).map((section) => (
							<motion.button
								key={section}
								onClick={() => onNavigate(section)}
								onHoverStart={() => setHover(section)}
								onHoverEnd={() => setHover(null)}
								layout={true}
								initial={{ scale: 0.8, opacity: 0.5 }}
								animate={{
									scale: section === current ? 1.2 : hover === section ? 1.1 : 0.95,
									opacity: section === current ? 1 : hover === section ? 0.8 : 0.4,
								}}
								transition={{ type: "spring", stiffness: 300, damping: 30 }}
								className={`relative w-10 h-10 rounded-full transition-all ${
									section === current ? "bg-white/90 shadow-lg" : "bg-white/20 hover:bg-white/40"
								}`}
								aria-label={`Go to ${SECTION_LABELS[section]}`}
								aria-current={section === current ? "page" : undefined}
							>
								<motion.div
									className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-0"
									animate={{
										opacity: hover === section ? 1 : 0,
									}}
									transition={{ duration: 0.2 }}
								/>
								<span className="text-xs font-bold text-center leading-10 text-black/70">
									{SECTION_LABELS[section].charAt(0)}
								</span>
							</motion.button>
						))}
					</AnimatePresence>
				</div>

				<motion.button
					onClick={onNext}
					disabled={!canGoNext}
					whileHover={{ scale: canGoNext ? 1.15 : 1 }}
					whileTap={{ scale: canGoNext ? 0.9 : 1 }}
					className="px-2 text-sm font-medium text-white/60 disabled:opacity-20 hover:text-white transition-colors cursor-pointer"
					aria-label="Next section"
				>
					→
				</motion.button>
			</motion.div>
		</div>
	);
}
