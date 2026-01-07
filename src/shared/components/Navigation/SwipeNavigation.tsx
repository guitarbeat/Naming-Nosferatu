import { motion, PanInfo } from "framer-motion";
import { ReactNode } from "react";
import { BOTTOM_NAV_ITEMS, MAIN_NAV_ITEMS } from "../../../config/navigation.config";
import { useRouting } from "../../../core/hooks/useRouting";

interface SwipeNavigationProps {
	children: ReactNode;
}

export function SwipeNavigation({ children }: SwipeNavigationProps) {
	const { currentRoute, navigateTo } = useRouting();

	const handleDragEnd = (_: unknown, info: PanInfo) => {
		const swipeThreshold = 50;
		const { offset, velocity } = info;

		if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
			const direction = offset.x > 0 ? -1 : 1; // -1 for right (prev), 1 for left (next)
			handleSwipe(direction);
		}
	};

	const handleSwipe = (direction: number) => {
		// filter items that are in bottom nav
		const navItems = BOTTOM_NAV_ITEMS.map((key) =>
			MAIN_NAV_ITEMS.find((item) => item.key === key),
		).filter((item): item is typeof MAIN_NAV_ITEMS[0] => Boolean(item));

		const currentIndex = navItems.findIndex((item) => {
             if (item.route === "/") return currentRoute === "/";
             return currentRoute.startsWith(item.route || "");
        });

		if (currentIndex === -1) return;

		const nextIndex = currentIndex + direction;

		if (nextIndex >= 0 && nextIndex < navItems.length) {
            const nextItem = navItems[nextIndex];
            if (nextItem.route) {
                // Add haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
                navigateTo(nextItem.route);
            }
		}
	};

	return (
		<motion.div
			drag="x"
			dragConstraints={{ left: 0, right: 0 }}
			dragElastic={0.05} // Minimal elasticity to feel like a swipe but not move the whole page too much
            onDragEnd={handleDragEnd}
            style={{ minHeight: '100%', touchAction: 'pan-y' }} // Allow vertical scroll, handle horizontal swipe
		>
			{children}
		</motion.div>
	);
}
