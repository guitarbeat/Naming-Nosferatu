import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import type { NavItem } from "../types";
import { ModeToggles } from "./ModeToggles";
import { NavbarLink } from "./NavbarLink";

export function MobileMenu({
	isOpen,
	navItems,
	homeIsActive,
	onHomeClick,
	onNavClick,
}: {
	isOpen: boolean;
	navItems: NavItem[];
	homeIsActive: boolean;
	onHomeClick: () => void;
	onNavClick: (item: NavItem) => void;
}) {
	const firstLinkRef = useRef<HTMLButtonElement>(null);
	const lastLinkRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (isOpen && firstLinkRef.current) {
			firstLinkRef.current.focus();
		}
	}, [isOpen]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent, isFirst: boolean, isLast: boolean) => {
			if (event.key === "Tab") {
				if (event.shiftKey && isFirst) {
					event.preventDefault();
					lastLinkRef.current?.focus();
				} else if (!event.shiftKey && isLast) {
					event.preventDefault();
					firstLinkRef.current?.focus();
				}
			}
		},
		[],
	);

	if (!isOpen) return null;

	return (
		<nav
			id="app-navbar-mobile-panel"
			className="app-navbar-mobile-panel"
			role="navigation"
			aria-label="Mobile navigation"
			data-open={isOpen}
		>
			<div className="app-navbar-mobile-panel__content">
				<button
					ref={firstLinkRef}
					type="button"
					onClick={onHomeClick}
					className="app-navbar__mobile-link"
					data-active={homeIsActive}
					aria-current={homeIsActive ? "page" : undefined}
					onKeyDown={(e) => handleKeyDown(e, true, navItems.length === 0)}
				>
					<span className="app-navbar__link-text">Tournament</span>
				</button>

				{navItems.map((item, index) => {
					const _isLast = index === navItems.length - 1;
					return (
						<NavbarLink
							key={item.key}
							item={item}
							onClick={onNavClick}
							className="app-navbar__mobile-link"
						/>
					);
				})}

				<div className="app-navbar__mobile-separator" />
				<div className="app-navbar__mobile-toggles">
					<ModeToggles isMobile />
				</div>
			</div>
		</nav>
	);
}
