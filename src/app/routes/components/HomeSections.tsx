import { motion } from "framer-motion";
import { TIMING } from "@/shared/lib/constants";
import { themeText } from "@/shared/lib/themeClasses";
import type { NameItem } from "@/shared/types";

type HomeHeroState = "loading" | "ready" | "error";

interface HomeHeroSectionProps {
	state: HomeHeroState;
	lockedNames: NameItem[];
}

function HeroNameWords({ state, lockedNames }: { state: HomeHeroState; lockedNames: NameItem[] }) {
	if (state === "loading") {
		return <span className={themeText.heroPlaceholder}>________</span>;
	}
	if (state === "error" || lockedNames.length === 0) {
		return <span>Nosferatu</span>;
	}

	const words = [...lockedNames.flatMap((n) => n.name.toUpperCase().split(/\s+/)), "WOODS"];

	return (
		<span>
			{words.map((word, i) => (
				<span key={`${word}-${i}`} className="block sm:inline-block">
					{i < words.length - 1 ? `${word}\u00a0` : word}
				</span>
			))}
		</span>
	);
}

export function HomeHeroSection({ state, lockedNames }: HomeHeroSectionProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
			className="flex flex-col items-center justify-center text-center max-w-4xl gap-8 md:gap-12"
		>
			<motion.p
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1, duration: TIMING.MOTION_NORMAL, ease: TIMING.MOTION_EASING }}
				className="text-sm font-medium uppercase tracking-wider text-muted-foreground/70"
			>
				What should we name my cat?
			</motion.p>

			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.2, duration: TIMING.MOTION_SLOW, ease: TIMING.MOTION_EASING }}
			>
				<h1
					className={`${themeText.heroDisplay} tracking-tighter`}
					style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)", lineHeight: 1.05 }}
				>
					<HeroNameWords state={state} lockedNames={lockedNames} />
				</h1>
			</motion.div>

			<motion.h2
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.35, duration: TIMING.MOTION_SLOW, ease: TIMING.MOTION_EASING }}
				className="text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-foreground/85 text-center max-w-2xl px-4"
				style={{ lineHeight: 1.4 }}
			>
				Pick your favorites and see which names score highest with your friends.
			</motion.h2>
		</motion.div>
	);
}
