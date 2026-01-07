import React, { useEffect, useRef } from "react";
import { NavbarLink } from "./NavbarLink";
import { ModeToggles } from "./NavbarToggles";
import type { NavItem } from "./navbarCore";

export function MobileMenuToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			className="app-navbar__toggle"
			aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
			aria-expanded={isOpen}
			aria-controls="app-navbar-mobile-panel"
			onClick={onToggle}
			title={isOpen ? "Close menu" : "Open menu"}
		>
			<div className="hamburger-icon" aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
		</button>
	);
}

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

	const handleKeyDown = (event: React.KeyboardEvent, isFirst: boolean, isLast: boolean) => {
		if (event.key === "Tab") {
			if (event.shiftKey && isFirst) {
				event.preventDefault();
				lastLinkRef.current?.focus();
			} else if (!event.shiftKey && isLast) {
				event.preventDefault();
				firstLinkRef.current?.focus();
			}
		}
	};

	if (!isOpen) {
		return null;
	}

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
					ref={(el) => {
						if (el) {
							firstLinkRef.current = el;
							if (navItems.length === 0) {
								lastLinkRef.current = el;
							}
						}
					}}
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
					const isLast = index === navItems.length - 1;
					return (
						<NavbarLink
							key={item.key}
							item={item}
							onClick={onNavClick}
							className="app-navbar__mobile-link"
							onKeyDown={(e) => handleKeyDown(e, false, isLast)}
							ref={isLast ? lastLinkRef : undefined}
						/>
					);
				})}

				<div className="app-navbar__mobile-separator" />
				<div className="app-navbar__mobile-toggles">
					<ModeToggles isMobile={true} />
				</div>
			</div>
		</nav>
	);
}
