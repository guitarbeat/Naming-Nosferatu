import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ChevronDown, Lightbulb, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BOTTOM_NAV_ITEMS, getBottomNavItems, MAIN_NAV_ITEMS } from "../../navigation";
import styles from "./navigation.module.css";

interface AdaptiveNavProps {
	onOpenSuggestName?: () => void;
}

/**
 * Unified Adaptive Navigation Component
 * Consolidates DesktopNav, BottomNav, MobileMenu, and SwipeNavigation into a single responsive component
 */
export function AdaptiveNav({ onOpenSuggestName }: AdaptiveNavProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [isMobile, setIsMobile] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [hidden, setHidden] = useState(false);
	const { scrollY } = useScroll();

	// Detect mobile vs desktop
	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 768px)");
		const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

		setIsMobile(mediaQuery.matches);
		mediaQuery.addEventListener("change", handleChange);

		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	// Smart hide/show on scroll (desktop only)
	useMotionValueEvent(scrollY, "change", (latest) => {
		if (isMobile) return;
		const previous = scrollY.getPrevious() || 0;
		if (latest > previous && latest > 150) {
			setHidden(true);
		} else {
			setHidden(false);
		}
	});

	// Global keyboard listener for shortcuts overlay
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				e.target instanceof HTMLSelectElement
			) {
				return;
			}

			if (e.key === "?") {
				e.preventDefault();
				setShowShortcuts((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleNavClick = (route?: string) => {
		if (route) {
			if (isMobile && navigator.vibrate) {
				navigator.vibrate(10);
			}
			navigate(route);
			setIsMobileMenuOpen(false); // Close mobile menu on navigation
		}
	};

	const isActive = (route?: string, exact = false) => {
		if (!route) return false;
		if (route === "/") return location.pathname === "/";
		return exact ? location.pathname === route : location.pathname.startsWith(route);
	};

	// Filter bottom nav items based on tournament completion
	const tournamentComplete = true; // TODO: Get from store
	const visibleBottomItems = tournamentComplete
		? BOTTOM_NAV_ITEMS
		: BOTTOM_NAV_ITEMS.filter((key) => key !== "results");
	const bottomNavItems = getBottomNavItems(MAIN_NAV_ITEMS, visibleBottomItems);

	if (isMobile) {
		return (
			<>
				{/* Bottom Navigation Bar */}
				<motion.div
					className={styles.bottomNav}
					initial={{ y: 100 }}
					animate={{ y: 0 }}
					transition={{ duration: 0.3 }}
				>
					<nav className={styles.bottomNavContainer} role="navigation" aria-label="Mobile navigation">
						{bottomNavItems.map((item) => {
							const itemActive = isActive(item?.route);

							return (
								<button
									key={item.key}
									className={`${styles.bottomNavItem} ${itemActive ? styles.active : ""}`}
									onClick={() => handleNavClick(item.route)}
									aria-current={itemActive ? "page" : undefined}
									aria-label={item.ariaLabel || item.label}
								>
									{item.icon && <item.icon className={styles.bottomNavIcon} aria-hidden={true} />}
									<span className={styles.bottomNavLabel}>{item.shortLabel || item.label}</span>
									{itemActive && (
										<motion.div
											layoutId="bottomNavIndicator"
											className={styles.bottomNavIndicator}
											initial={false}
											transition={{ type: "spring", stiffness: 500, damping: 30 }}
										/>
									)}
								</button>
							);
						})}

						{/* Suggest Name Action Button */}
						{onOpenSuggestName && (
							<button
								className={`${styles.bottomNavItem} ${styles.bottomNavAction}`}
								onClick={() => {
									if (navigator.vibrate) navigator.vibrate(10);
									onOpenSuggestName();
								}}
								aria-label="Suggest a name"
								title="Suggest a name"
							>
								<Lightbulb className={styles.bottomNavIcon} aria-hidden={true} />
								<span className={styles.bottomNavLabel}>Suggest</span>
							</button>
						)}

						{/* Mobile Menu Toggle */}
						<button
							className={`${styles.bottomNavItem} ${styles.bottomNavAction}`}
							onClick={() => setIsMobileMenuOpen(true)}
							aria-label="Open menu"
						>
							<Menu className={styles.bottomNavIcon} aria-hidden={true} />
							<span className={styles.bottomNavLabel}>Menu</span>
						</button>

					</nav>
				</motion.div>

				{/* Mobile Menu Overlay */}
				<AnimatePresence>
					{isMobileMenuOpen && (
						<>
							{/* Backdrop */}
							<motion.div
								className={styles.mobileMenuBackdrop}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setIsMobileMenuOpen(false)}
								aria-hidden="true"
							/>

							{/* Menu Panel */}
							<motion.div
								className={styles.mobileMenuPanel}
								initial={{ x: "100%" }}
								animate={{ x: 0 }}
								exit={{ x: "100%" }}
								transition={{ type: "spring", damping: 25, stiffness: 200 }}
								role="dialog"
								aria-modal="true"
								aria-label="Mobile Navigation"
							>
								<div className={styles.mobileMenuHeader}>
									<span className={styles.mobileMenuTitle}>Menu</span>
									<button
										className={styles.mobileMenuCloseButton}
										onClick={() => setIsMobileMenuOpen(false)}
										aria-label="Close menu"
									>
										<X size={24} />
									</button>
								</div>

								<nav className={styles.mobileMenuNav}>
									{MAIN_NAV_ITEMS.map((item) => (
										<MobileNavItem
											key={item.key}
											item={item}
											isActive={isActive}
											onNavClick={handleNavClick}
										/>
									))}
								</nav>

							</motion.div>
						</>
					)}
				</AnimatePresence>
			</>
		);
	}

	// Desktop Navigation
	return (
		<>
			<header className={`${styles.desktopNav} ${hidden ? styles.hidden : ""}`}>
				<div className={styles.desktopNavContainer}>
					<div className={styles.desktopNavLeft}>
						{/* Logo */}
						<a
							href="/"
							className={styles.desktopNavLogo}
							onClick={(e) => {
								e.preventDefault();
								navigate("/");
							}}
						>
							Naming Nosferatu
						</a>

						{/* Primary Navigation */}
						<nav className={styles.desktopNavLinks} role="navigation">
							{MAIN_NAV_ITEMS.map((item) => (
								<div key={item.key} className={styles.desktopNavItem}>
									<button
										className={`${styles.desktopNavLink} ${isActive(item.route) ? styles.active : ""}`}
										onClick={() => handleNavClick(item.route)}
										aria-expanded={false}
									>
										{item.icon && <item.icon className={styles.desktopNavIcon} />}
										{item.label}
									</button>

									{/* Dropdown for children */}
									{item.children && item.children.length > 0 && (
										<div className={styles.desktopNavDropdown}>
											{item.children.map((child) => (
												<button
													key={child.key}
													className={`${styles.desktopNavDropdownItem} ${
														isActive(child.route, true) ? styles.active : ""
													}`}
													onClick={(e) => {
														e.stopPropagation();
														handleNavClick(child.route);
													}}
												>
													{child.label}
												</button>
											))}
										</div>
									)}
								</div>
							))}
						</nav>
					</div>

					{/* Right Section: Utilities */}
					<div className={styles.desktopNavRight}>
						{onOpenSuggestName && (
							<button
								className={styles.desktopNavUtilityBtn}
								onClick={onOpenSuggestName}
								aria-label="Suggest a name"
								title="Suggest a new cat name"
							>
								<Lightbulb size={20} />
							</button>
						)}

						<button
							className={styles.desktopNavUtilityBtn}
							onClick={() => setShowShortcuts(true)}
							aria-label="Keyboard Shortcuts"
							title="Press '?' for keyboard shortcuts"
						>
							<HelpCircle size={20} />
						</button>
					</div>
				</div>
			</header>

			{/* Spacing to prevent content from jumping when nav is fixed */}
			<div style={{ height: "64px", display: "none" }} className="desktop-spacer" />

			<KeyboardShortcutsOverlay isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
		</>
	);
}

// Mobile Navigation Item Component
function MobileNavItem({
	item,
	isActive,
	onNavClick,
}: {
	item: (typeof MAIN_NAV_ITEMS)[0];
	isActive: (route?: string) => boolean;
	onNavClick: (route?: string) => void;
}) {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasChildren = item.children && item.children.length > 0;
	const isItemActive = isActive(item.route);

	// Auto-expand if child is active
	useEffect(() => {
		if (hasChildren && item.children?.some((child) => isActive(child.route))) {
			setIsExpanded(true);
		}
	}, [hasChildren, item.children, isActive]);

	const handleClick = () => {
		if (navigator.vibrate) navigator.vibrate(10);
		if (hasChildren) {
			setIsExpanded(!isExpanded);
		} else {
			onNavClick(item.route);
		}
	};

	return (
		<div className={styles.mobileNavItemContainer}>
			<button
				className={`${styles.mobileNavItem} ${isItemActive ? styles.active : ""}`}
				onClick={handleClick}
				aria-expanded={hasChildren ? isExpanded : undefined}
			>
				<div className={styles.mobileNavItemContent}>
					{item.icon && <item.icon className={styles.mobileNavIcon} />}
					<span className={styles.mobileNavLabel}>{item.label}</span>
				</div>
				{hasChildren && (
					<ChevronDown
						className={styles.mobileNavChevron}
						style={{
							transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
						}}
					/>
				)}
			</button>

			<AnimatePresence>
				{hasChildren && isExpanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className={styles.mobileNavChildrenContainer}
					>
						{item.children?.map((child) => (
							<button
								key={child.key}
								className={`${styles.mobileNavChildItem} ${isActive(child.route) ? styles.active : ""}`}
								onClick={() => onNavClick(child.route)}
							>
								{child.label}
							</button>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
