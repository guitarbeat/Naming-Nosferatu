import { motion, PanInfo } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BOTTOM_NAV_ITEMS, MAIN_NAV_ITEMS } from "../navigation";

interface SwipeWrapperProps {
	children: ReactNode;
}

/**
 * SwipeWrapper component that provides swipe navigation between main routes
 * Extracted from SwipeNavigation to work with the unified AdaptiveNav
 */
export function SwipeWrapper({ children }: SwipeWrapperProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobile, setIsMobile] = useState(false);

	// Detect mobile for swipe functionality
	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

		setIsMobile(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);

		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const handleSwipe = (direction: number) => {
		// Filter items that are in bottom nav
		const navItems = BOTTOM_NAV_ITEMS.map((key) =>
			MAIN_NAV_ITEMS.find((item) => item.key === key),
		).filter((item): item is (typeof MAIN_NAV_ITEMS)[0] => Boolean(item));

		const currentIndex = navItems.findIndex((item) => {
			if (item.route === "/") {
				return location.pathname === "/";
			}
			return location.pathname.startsWith(item.route || "");
		});

		if (currentIndex === -1) {
			return;
		}

		const nextIndex = currentIndex + direction;

		if (nextIndex >= 0 && nextIndex < navItems.length) {
			const nextItem = navItems[nextIndex];
			if (nextItem?.route) {
				// Add haptic feedback
				if (navigator.vibrate) {
					navigator.vibrate(10);
				}
				navigate(nextItem.route);
			}
		}
	};

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		if (!isMobile) return;

		const swipeThreshold = 50;
		const { offset, velocity } = info;

		if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
			const direction = offset.x > 0 ? -1 : 1; // -1 for right (prev), 1 for left (next)
			handleSwipe(direction);
		}
	};

	return (
		<motion.div
			drag={isMobile ? "x" : false}
			dragConstraints={{ left: 0, right: 0 }}
			dragElastic={0.05} // Minimal elasticity to feel like a swipe but not move the whole page too much
			onDragEnd={handleDragEnd}
			style={{ minHeight: "100%", touchAction: "pan-y" }} // Allow vertical scroll, handle horizontal swipe
		>
			{children}
		</motion.div>
	);
}