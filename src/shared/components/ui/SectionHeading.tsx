import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TIMING } from "@/shared/lib/constants";

export const SectionHeading = memo(function SectionHeading({
	id,
	title,
	subtitle,
}: {
	id?: string;
	title: string;
	subtitle: string;
}) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			className="mx-auto mb-[var(--space-phi-4)] flex w-full max-w-2xl flex-col items-center text-center sm:mb-[var(--space-phi-5)]"
			initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
			whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-100px" }}
			transition={{ duration: TIMING.MOTION_NORMAL, ease: TIMING.MOTION_EASING }}
		>
			<motion.h2
				id={id}
				className="font-display font-bold leading-[0.96] tracking-[-0.03em] text-foreground bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text"
				whileHover={prefersReducedMotion ? undefined : { scale: 1.02, textShadow: "0px 4px 15px rgba(var(--primary), 0.2)" }}
				transition={{ type: "spring", stiffness: 300, damping: 20 }}
			>
				{title}
			</motion.h2>
			<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
				{subtitle}
			</p>
		</motion.div>
	);
});
