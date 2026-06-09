import { motion } from "framer-motion";
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

export function SectionFlow({ sections, onSectionChange }: SectionFlowProps) {
	const [current, setCurrent] = useState<Section>("hero");
	const currentIndex = SECTION_ORDER[current];

	const navigate = useCallback(
		(target: Section) => {
			setCurrent(target);
			onSectionChange?.(target);
		},
		[onSectionChange],
	);

	const next = useCallback(() => {
		const nextSection = SECTIONS[Math.min(currentIndex + 1, SECTIONS.length - 1)];
		navigate(nextSection);
	}, [currentIndex, navigate]);

	const prev = useCallback(() => {
		const prevSection = SECTIONS[Math.max(currentIndex - 1, 0)];
		navigate(prevSection);
	}, [currentIndex, navigate]);

	return (
		<motion.div
			key={current}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className="w-full"
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

			<SectionFlowNav
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

interface SectionFlowNavProps {
	current: Section;
	canGoPrev: boolean;
	canGoNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	onNavigate: (section: Section) => void;
}

function SectionFlowNav({
	current,
	canGoPrev,
	canGoNext,
	onPrev,
	onNext,
	onNavigate,
}: SectionFlowNavProps) {
	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
			<button
				onClick={onPrev}
				disabled={!canGoPrev}
				className="px-3 py-1 text-sm font-medium text-white/70 disabled:opacity-20 hover:text-white transition-colors"
				aria-label="Previous section"
			>
				← Back
			</button>

			<div className="flex gap-1">
				{(["hero", "pick", "tournament", "analysis"] as Section[]).map((section) => (
					<button
						key={section}
						onClick={() => onNavigate(section)}
						className={`w-2 h-2 rounded-full transition-all ${
							section === current ? "bg-white w-6" : "bg-white/30 hover:bg-white/50"
						}`}
						aria-label={`Go to ${section}`}
						aria-current={section === current ? "page" : undefined}
					/>
				))}
			</div>

			<button
				onClick={onNext}
				disabled={!canGoNext}
				className="px-3 py-1 text-sm font-medium text-white/70 disabled:opacity-20 hover:text-white transition-colors"
				aria-label="Next section"
			>
				Next →
			</button>
		</div>
	);
}
