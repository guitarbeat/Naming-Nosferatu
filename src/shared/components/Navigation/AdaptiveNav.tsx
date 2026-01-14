/**
 * @module AdaptiveNav
 * @description Unified navigation component - flat structure for SPA
 * Adapts between mobile bottom nav and desktop header nav
 */

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Lightbulb, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAppStore from "../../../core/store/useAppStore";
import { BOTTOM_NAV_ITEMS, getBottomNavItems, MAIN_NAV_ITEMS } from "../../navigation";
import styles from "./navigation.module.css";

interface AdaptiveNavProps {
	onOpenSuggestName?: () => void;
}

// Simple map from nav keys to routes
const keyToRoute: Record<string, string> = {
	tournament: "/tournament",
	results: "/results",
	analysis: "/analysis",
	gallery: "/gallery",
	explore: "/explore",
};

/**
 * Unified Adaptive Navigation Component
 * Clean, flat navigation without submenus
 */
export function AdaptiveNav({ onOpenSuggestName }: AdaptiveNavProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const { tournament } = useAppStore();
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

	const handleNavClick = (key: string) => {
		const route = keyToRoute[key];
		if (route) {
			if (isMobile && navigator.vibrate) {
				navigator.vibrate(10);
			}
			navigate(route);
			setIsMobileMenuOpen(false);
		}
	};

	const isActive = (key: string) => {
		const route = keyToRoute[key];
		return location.pathname === route;
	};

	// Filter bottom nav items based on tournament completion
	const visibleBottomItems = tournament.isComplete
		? BOTTOM_NAV_ITEMS
		: BOTTOM_NAV_ITEMS.filter((key) => key !== "results");
	const bottomNavItems = getBottomNavItems(MAIN_NAV_ITEMS, visibleBottomItems);

	// Mobile Navigation
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
					<nav
						className={styles.bottomNavContainer}
						role="navigation"
						aria-label="Mobile navigation"
					>
						{bottomNavItems.map((item) => {
							const itemActive = isActive(item.key);

							return (
								<button
									key={item.key}
									className={`${styles.bottomNavItem} ${itemActive ? styles.active : ""}`}
									onClick={() => handleNavClick(item.key)}
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
										<button
											key={item.key}
											className={`${styles.mobileNavItem} ${isActive(item.key) ? styles.active : ""}`}
											onClick={() => handleNavClick(item.key)}
										>
											<div className={styles.mobileNavItemContent}>
												{item.icon && <item.icon className={styles.mobileNavIcon} />}
												<span className={styles.mobileNavLabel}>{item.label}</span>
											</div>
										</button>
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
						<button className={styles.desktopNavLogo} onClick={() => handleNavClick("tournament")}>
							Naming Nosferatu
						</button>

						{/* Primary Navigation - flat, no dropdowns */}
						<nav className={styles.desktopNavLinks} role="navigation">
							{MAIN_NAV_ITEMS.map((item) => (
								<button
									key={item.key}
									className={`${styles.desktopNavLink} ${isActive(item.key) ? styles.active : ""}`}
									onClick={() => handleNavClick(item.key)}
									aria-label={item.ariaLabel || item.label}
								>
									{item.icon && <item.icon className={styles.desktopNavIcon} />}
									{item.label}
								</button>
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
					</div>
				</div>
			</header>

			{/* Spacing to prevent content from jumping when nav is fixed */}
			<div style={{ height: "64px", display: "none" }} className="desktop-spacer" />
		</>
	);
}
