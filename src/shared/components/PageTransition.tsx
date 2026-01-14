/**
 * @module PageTransition
 * @description Animated page transition wrapper using Framer Motion.
 * Provides smooth fade and slide animations between route changes.
 */

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
	children: ReactNode;
}

// Animation variants for page transitions
const pageVariants = {
	initial: {
		opacity: 0,
		y: 10,
	},
	enter: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.25,
			ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
		},
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: {
			duration: 0.2,
			ease: [0.25, 0.46, 0.45, 0.94],
		},
	},
};

/**
 * PageTransition Component
 * Wraps route content with animated transitions for smooth page changes.
 * Uses the current location pathname as the animation key.
 */
export function PageTransition({ children }: PageTransitionProps) {
	const location = useLocation();

	return (
		<motion.div
			key={location.pathname}
			initial="initial"
			animate="enter"
			exit="exit"
			variants={pageVariants}
			style={{ width: "100%", height: "100%" }}
		>
			{children}
		</motion.div>
	);
}
