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
			<div className="floating-navbar-shell relative flex items-center p-1.5 sm:p-2 rounded-full">
				<div className="nav-menu relative flex items-center justify-center gap-1.5 sm:gap-2 z-10">
					{visibleItems.map((item) => {
						const isActive = Boolean(item.isActive);
						const isAccent = Boolean(item.isAccent);
						const hasBadge = Boolean(item.hasBadge);

						return (
							<motion.button
								key={item.id}
								type="button"
								onClick={() => {
									hapticNavTap();
									item.onClick();
								}}
								whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
								whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
								className={cn(
									"group relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary select-none cursor-pointer floating-nav-button",
									isActive
										? "floating-nav-button--active px-4 py-2 sm:px-5 sm:py-2.5 gap-2"
										: "p-2 sm:p-2.5 text-muted-foreground",
									!isActive && isAccent ? "floating-nav-button--accent" : "",
								)}
								aria-label={item.label}
								title={item.label}
								aria-current={isActive ? "page" : undefined}
							>
								<span
									className={cn(
										"relative z-10 flex items-center justify-center shrink-0 transition-colors duration-200 floating-nav-icon",
										isActive && "text-[var(--nav-text)]",
									)}
								>
									{item.icon}
								</span>
								{isActive && (
									<span className="relative z-10 whitespace-nowrap tracking-normal font-semibold text-[var(--nav-text)] text-xs sm:text-sm pl-0.5">
										{item.label}
									</span>
								)}
								{hasBadge && !isActive && (
									<span className="absolute top-1 right-1.5 sm:top-1.5 sm:right-2 flex size-2 z-20">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
										<span className="relative inline-flex size-2 rounded-full bg-accent ring-2 ring-card" />
										{item.badgeContent && <span className="sr-only">{item.badgeContent}</span>}
									</span>
								)}
							</motion.button>
						);
					})}
				</div>
			</div>
		</motion.nav>
	);
});
