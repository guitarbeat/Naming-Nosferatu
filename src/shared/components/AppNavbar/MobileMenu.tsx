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
	const panelRef = useRef<HTMLNavElement>(null);

	// Focus management and body scroll locking
	useEffect(() => {
		if (isOpen) {
			// Lock body scroll
			document.body.style.overflow = "hidden";

			// Trap focus within menu
			if (firstLinkRef.current) {
				firstLinkRef.current.focus();
			}
		} else {
			// Restore body scroll
			document.body.style.overflow = "";
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Handle escape key to close menu
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isOpen) {
				// Close menu via context - we'll dispatch through the panel
				const toggleButton = document.querySelector(
					'.app-navbar__toggle[aria-expanded="true"]',
				) as HTMLButtonElement;
				toggleButton?.click();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscapeKey);
		}

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
		};
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
			ref={panelRef}
			id="app-navbar-mobile-panel"
			className="app-navbar-mobile-panel"
			role="navigation"
			aria-label="Mobile navigation menu"
			aria-modal="true"
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
					title="Go to tournament home"
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

				<div className="app-navbar__mobile-separator" aria-hidden="true" />
				<div className="app-navbar__mobile-toggles">
					<ModeToggles isMobile={true} />
				</div>
			</div>
		</nav>
	);
}
