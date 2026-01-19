/**
 * @module AdaptiveNav
 * @description Unified navigation component - Floating "Dock" style for all screens
 * Uses Scroll Navigation for Single Page Architecture
 */

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import useAppStore from "../../../core/store/useAppStore";
import { getBottomNavItems, MAIN_NAV_ITEMS } from "../../navigation";
import styles from "./navigation.module.css";

interface AdaptiveNavProps {
	onOpenSuggestName?: () => void;
}

// Map nav keys to Section IDs
const keyToId: Record<string, string> = {
	pick: "pick",
	play: "play",
	analyze: "analysis",
	gallery: "gallery",
	suggest: "suggest",
};

/**
 * Unified Floating Dock Navigation
 * Renders as a floating pill at the bottom on all screen sizes
 */
export function AdaptiveNav(_props: AdaptiveNavProps) {
	const { tournament, tournamentActions } = useAppStore();
	const { selectedNames } = tournament;
	const [_isMobileMenuOpen, _setIsMobileMenuOpen] = useState(false);
	const [activeSection, setActiveSection] = useState("play");

	// * Check if tournament is ready to start
	const { isComplete, names: tournamentNames } = tournament;

	const isTournamentActive = !!tournamentNames;
	const selectedCount = selectedNames?.length || 0;
	const isReadyToStart = !isComplete && !isTournamentActive && selectedCount >= 2;

	const handleStartTournament = () => {
		// * Start Logic Replicated from TournamentHooks to avoid circular deps or hook overhead
		// * 1. Clear State
		tournamentActions.resetTournament();
		tournamentActions.setLoading(true);

		// * 2. Set Names (Assume already filtered by NameManagementView or filter here if needed)
		// Selection comes from NameManagementView which generally handles visibility,
		// but we can't easily filter hidden without importing utilities.
		// Assuming selected items are valid.
		if (selectedNames && selectedNames.length >= 2) {
			tournamentActions.setNames(selectedNames);
		}

		// * 3. Finish Loading & Scroll
		setTimeout(() => {
			tournamentActions.setLoading(false);
			const element = document.getElementById("play");
			element?.scrollIntoView({ behavior: "smooth" });
			setActiveSection("play");
		}, 100);
	};

	// Scroll to section handler
	const handleNavClick = (key: string) => {
		if (key === "play") {
			if (isReadyToStart) {
				handleStartTournament();
				return;
			}
			// If not ready and not active, maybe shake or show toast?
			// For now, if disabled in UI, this click might not happen or should be blocked.
			if (!isTournamentActive && !isComplete && selectedCount < 2) {
				// Prevent navigation/action if not ready
				return;
			}
		}

		const id = keyToId[key];
		if (id) {
			const element = document.getElementById(id);
			if (element) {
				if (navigator.vibrate) {
					navigator.vibrate(10);
				}
				element.scrollIntoView({ behavior: "smooth" });
				// Optimistically set active section
				setActiveSection(id);
			}
		}
	};

	// Track active section on scroll
	useEffect(() => {
		const handleScroll = () => {
			const sections = ["pick", "play", "gallery", "analysis", "suggest"];

			// Find the section that occupies the most screen space or is at the top
			let current = activeSection;

			// Simple check for which section is closest to top of viewport
			let minDistance = Infinity;

			for (const id of sections) {
				const element = document.getElementById(id);
				if (element) {
					const rect = element.getBoundingClientRect();
					// We care about the section being active if it's generally in the middle of the screen
					// or simply check if the top is near 0 or distinct overlap
					const distance = Math.abs(rect.top); // absolute distance to top
					if (distance < minDistance && distance < window.innerHeight * 0.6) {
						minDistance = distance;
						current = id;
					}
				}
			}

			if (current === "play") {
				// We are in the Play section
			}

			// Simplification: just store the section ID as the active state source of truth
			// And active check determines if nav item maps to it.
			setActiveSection(current);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		// Initial check
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, [activeSection]);

	// Custom isActive check
	const isActive = (key: string) => {
		const targetId = keyToId[key];
		return activeSection === targetId;
	};

	// Filter bottom nav items based on tournament completion
	const visibleBottomItems = tournament.isComplete
		? ["pick", "gallery", "analyze"]
		: ["pick", "gallery", "play"];

	const bottomNavItems = getBottomNavItems(MAIN_NAV_ITEMS, visibleBottomItems);

	return (
		<motion.div
			className={styles.bottomNav}
			initial={{ y: 20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<nav className={styles.bottomNavContainer} role="navigation" aria-label="Main navigation">
				{bottomNavItems.map((item) => {
					const itemActive = isActive(item.key);

					// * Special Handling for Play Button
					let label = item.shortLabel || item.label;
					let isDisabled = false;
					let isHighlight = false;

					if (item.key === "play") {
						if (!isTournamentActive && !isComplete) {
							if (selectedCount < 2) {
								label = "Pick 2+";
								isDisabled = true; // Visual grey out
							} else {
								label = `Start (${selectedCount})`;
								isHighlight = true;
							}
						}
					}

					const isPlayReady = item.key === "play" && isHighlight;

					return (
						<motion.button
							key={item.key}
							className={`${styles.bottomNavItem} ${itemActive ? styles.active : ""} ${isDisabled ? styles.disabled : ""} ${isHighlight ? styles.highlight : ""}`}
							onClick={() => handleNavClick(item.key)}
							aria-current={itemActive ? "page" : undefined}
							aria-label={item.ariaLabel || item.label}
							disabled={isDisabled}
							type="button"
							animate={
								isPlayReady
									? {
											scale: [1, 1.05, 1],
											boxShadow: [
												"0 0 12px rgba(var(--color-neon-cyan-rgb), 0.2)",
												"0 0 20px rgba(var(--color-neon-cyan-rgb), 0.6)",
												"0 0 12px rgba(var(--color-neon-cyan-rgb), 0.2)",
											],
										}
									: {}
							}
							transition={
								isPlayReady
									? {
											duration: 2,
											repeat: Infinity,
											ease: "easeInOut",
										}
									: {}
							}
						>
							{item.icon && <item.icon className={styles.bottomNavIcon} aria-hidden={true} />}
							<span className={styles.bottomNavLabel}>{label}</span>
							{itemActive && (
								<motion.div
									layoutId="dockIndicator"
									className={styles.bottomNavIndicator}
									initial={false}
									transition={{ type: "spring", stiffness: 500, damping: 30 }}
								/>
							)}
						</motion.button>
					);
				})}

				{/* Inline Suggestion Trigger */}
				<button
					className={`${styles.bottomNavItem} ${isActive("suggest") ? styles.active : ""}`}
					onClick={() => handleNavClick("suggest")}
					aria-label="Suggest a name"
					title="Suggest a name"
					type="button"
				>
					<Lightbulb className={styles.bottomNavIcon} aria-hidden={true} />
					<span className={styles.bottomNavLabel}>Suggest</span>
					{isActive("suggest") && (
						<motion.div
							layoutId="dockIndicator"
							className={styles.bottomNavIndicator}
							initial={false}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
						/>
					)}
				</button>
			</nav>
		</motion.div>
	);
}
