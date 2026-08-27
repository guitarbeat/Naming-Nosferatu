import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { memo } from "react";
import { cn, hapticNavTap } from "@/shared/lib/utils";

export type NavItem = {
	id: string;
	label: string;
	icon: ReactNode;
	isActive?: boolean;
	isAccent?: boolean;
	hasBadge?: boolean;
	badgeContent?: ReactNode;
	onClick: () => void;
};

export const FloatingNav = memo(function FloatingNav({ items }: { items: NavItem[] }) {
	const shouldReduceMotion = useReducedMotion();
	const visibleItems = items.slice(0, 5);

	return (
		<motion.nav
			aria-label="Main Navigation"
			initial={shouldReduceMotion ? false : { y: 30, opacity: 0, scale: 0.95 }}
			animate={{ y: 0, opacity: 1, scale: 1 }}
			transition={{ type: "spring", stiffness: 400, damping: 30 }}
			className="floating-navbar-frame"
		>
			<div className="floating-navbar-shell relative flex items-center gap-1 p-1.5 sm:gap-2 sm:p-2 rounded-full overflow-hidden">
				<div className="nav-menu relative flex items-center justify-center gap-1 sm:gap-2 z-10 w-full">
					{visibleItems.map((item) => {
						const isActive = Boolean(item.isActive);
						const isAccent = Boolean(item.isAccent);

						return (
							<motion.button
								key={item.id}
								layout={!shouldReduceMotion}
								type="button"
								onClick={() => {
									hapticNavTap();
									item.onClick();
								}}
								whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
								whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
								className={cn(
									"group relative flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full overflow-hidden text-[13px] sm:text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer floating-nav-button",
									isActive
										? "floating-nav-button--active"
										: isAccent
											? "floating-nav-button--accent"
											: "",
								)}
								aria-label={item.label}
								aria-current={isActive ? "page" : undefined}
							>
								{isActive && (
									<motion.div
										layoutId="floating-nav-active-bubble"
										className="absolute inset-0 rounded-full floating-nav-active-bubble"
										transition={{
											type: "spring",
											stiffness: 400,
											damping: 32,
										}}
									/>
								)}
								<motion.span
									layout={shouldReduceMotion ? false : "position"}
									className={cn(
										"relative z-10 flex items-center justify-center shrink-0 transition-colors duration-300 floating-nav-icon",
										isActive && "text-primary-foreground",
									)}
								>
									{item.icon}
								</motion.span>
								<motion.span
									layout={shouldReduceMotion ? false : "position"}
									className={cn(
										"relative z-10 whitespace-nowrap tracking-tight transition-colors duration-300 floating-nav-label",
										isActive ? "block text-primary-foreground" : "hidden md:block",
									)}
								>
									{item.label}
								</motion.span>
							</motion.button>
						);
					})}
				</div>
			</div>
		</motion.nav>
	);
});
