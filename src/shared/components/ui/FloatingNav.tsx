import { memo, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export type NavItem = {
	id: string;
	label: string;
	icon: ReactNode;
	isActive?: boolean;
	isAccent?: boolean;
	hasBadge?: boolean;
	onClick: () => void;
};

export const FloatingNav = memo(function FloatingNav({
	items,
}: {
	items: NavItem[];
}) {
	const visibleItems = items.slice(0, 5);
	return (
		<nav aria-label="Primary" className="floating-navbar-frame">
			<div className="floating-navbar-shell">
				<div className="floating-navbar">
					<div
						className="floating-navbar__primary"
						style={{
							gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))`,
						}}
					>
						{visibleItems.map((item) => {
							const isActive = Boolean(item.isActive);
							return (
								<button
									key={item.id}
									type="button"
									onClick={item.onClick}
									className={cn(
										"floating-navbar__item floating-navbar__item--primary",
										item.isAccent && "floating-navbar__item--accent",
									)}
									aria-label={item.label}
									aria-current={isActive ? "location" : undefined}
								>
									<span className="floating-navbar__icon">
										{item.icon}
										{item.hasBadge && (
											<span className="floating-navbar__badge" />
										)}
									</span>
									<span className="floating-navbar__label">{item.label}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>
		</nav>
	);
});
