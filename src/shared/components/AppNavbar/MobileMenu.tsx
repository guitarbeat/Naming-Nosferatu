import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { NavItem } from "../../navigation";
import "./AppNavbar.css";
import { NavbarLink } from "./NavbarLink";
import { ModeToggles } from "./NavbarToggles";

export function MobileMenuToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			className="app-navbar__toggle"
			aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
			aria-expanded={isOpen}
			aria-controls="app-navbar-mobile-panel"
			onClick={() => {
				if (navigator.vibrate) {
					navigator.vibrate(10);
				}
				onToggle();
			}}
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

const CollapsibleNavItem = ({
	item,
	onNavClick,
}: {
	item: NavItem;
	onNavClick: (item: NavItem) => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const hasChildren = item.children && item.children.length > 0;

	const handleClick = () => {
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}
		if (hasChildren) {
			setIsOpen(!isOpen);
		} else {
			onNavClick(item);
		}
	};

	return (
		<div className="mobile-nav-group">
			<button
				type="button"
				className={`app-navbar__mobile-link ${hasChildren ? "has-children" : ""}`}
				onClick={handleClick}
				data-active={item.isActive}
				aria-expanded={hasChildren ? isOpen : undefined}
			>
				{item.icon && <item.icon className="app-navbar__link-icon" aria-hidden={true} />}
				<span className="app-navbar__link-text">{item.label}</span>
				{hasChildren && (
					<span
						className="chevron-icon"
						style={{
							transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
							transition: "transform 0.2s ease",
						}}
					>
						▼
					</span>
				)}
			</button>
			<AnimatePresence>
				{hasChildren && isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{ overflow: "hidden", paddingLeft: "16px" }}
						className="mobile-nav-children"
					>
						{item.children?.map((child) => (
							<NavbarLink
								key={child.key}
								item={child}
								onClick={(i) => {
									if (navigator.vibrate) {
										navigator.vibrate(10);
									}
									onNavClick(i);
								}}
								className="app-navbar__mobile-link child-link"
							/>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export function MobileMenu({
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
	const panelRef = useRef<HTMLElement>(null);

	// Focus management and body scroll locking
	useEffect(() => {
		// Lock body scroll
		document.body.style.overflow = "hidden";

		// Trap focus within menu
		// Note: since we use AnimatePresence, this runs on mount.
		// We might need a small timeout to wait for animation if elements aren't ready,
		// but React refs should resolve.
		if (firstLinkRef.current) {
			firstLinkRef.current.focus();
		}

		return () => {
			document.body.style.overflow = "";
		};
	}, []); // Run on mount (when isOpen becomes true and component mounts)

	// Handle escape key to close menu
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				// Close menu via context - we'll dispatch through the panel toggle
				// Ideally we should pass a onClose prop, but preserving current architecture:
				const toggleButton = document.querySelector(
					'.app-navbar__toggle[aria-expanded="true"]',
				) as HTMLButtonElement;
				toggleButton?.click();
			}
		};

		document.addEventListener("keydown", handleEscapeKey);

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
		};
	}, []);

	return (
		<motion.nav
			ref={panelRef}
			id="app-navbar-mobile-panel"
			className="app-navbar-mobile-panel"
			role="navigation"
			aria-label="Mobile navigation menu"
			aria-modal="true"
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.2 }}
			data-open={true} // Override css display control
		>
			<div className="app-navbar-mobile-panel__content">
				<button
					ref={firstLinkRef}
					type="button"
					onClick={() => {
						if (navigator.vibrate) {
							navigator.vibrate(10);
						}
						onHomeClick();
					}}
					className="app-navbar__mobile-link"
					data-active={homeIsActive}
					aria-current={homeIsActive ? "page" : undefined}
					title="Go to tournament home"
				>
					<span className="app-navbar__link-text">Tournament</span>
				</button>

				{navItems.map((item) => (
					<CollapsibleNavItem key={item.key} item={item} onNavClick={onNavClick} />
				))}

				<div className="app-navbar__mobile-separator" aria-hidden="true" />
				<div className="app-navbar__mobile-toggles">
					<ModeToggles isMobile={true} />
				</div>
			</div>
		</motion.nav>
	);
}
