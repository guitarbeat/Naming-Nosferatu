import { motion } from "framer-motion";

export function SystemFeed() {
	const prefersReducedMotion =
		typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	return (
		<div className="bg-amber-900/10 border-y border-amber-500/10 py-2 px-4 overflow-hidden relative">
			<div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50" />
			<motion.div
				animate={
					prefersReducedMotion
						? {}
						: {
								x: ["100%", "-100%"],
							}
				}
				transition={
					prefersReducedMotion
						? {}
						: {
								repeat: Infinity,
								duration: 20,
								ease: "linear",
							}
				}
				className="whitespace-nowrap flex gap-8 text-[10px] font-mono text-amber-200/70"
			>
				<span>SYSTEM_FEED: INITIATING NAME PROTOCOL...</span>
				<span>Scanning database for optimal feline designations {/*  */}</span>
				<span>Awaiting operator input...</span>
				<span>Did you know? Cats spend 70% of their lives sleeping.</span>
			</motion.div>
		</div>
	);
}
