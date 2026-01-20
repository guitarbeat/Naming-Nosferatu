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
import styles from "./AdaptiveNav.module.css";

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
	const appStore = useAppStore();
	const { tournament, tournamentActions } = appStore;
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
			if (!isTournamentActive && !isComplete && selectedCount < 2) {
				return;
			}
		}

		if (key === "gallery") {
			// Toggle Gallery Visibility
			const isVisible = appStore.ui.showGallery;
			appStore.uiActions.setGalleryVisible(!isVisible);

			// If we are opening it, scroll to it
			if (!isVisible) {
				setTimeout(() => {
					document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
				}, 100);
			}
			return;
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
				{/* Central Avatar Button - User Profile */}
				<div
					style={{
						position: "relative",
						margin: "0 0.5rem",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "0.125rem",
					}}
				>
					<div
						className="group cursor-pointer"
						onClick={() => appStore.uiActions.setEditingProfile(true)}
						title="Edit Profile"
						style={{ position: "relative" }}
					>
						{/* Glow effect */}
						<div
							style={{
								position: "absolute",
								inset: "-0.125rem",
								background:
									"linear-gradient(to right, var(--primary), var(--neon-accent, #00f0ff))",
								borderRadius: "9999px",
								filter: "blur(4px)",
								opacity: 0.5,
								transition: "opacity 300ms",
							}}
							className="group-hover:opacity-100"
						></div>
						{/* Avatar container */}
						<div
							style={{
								position: "relative",
								width: "2.5rem",
								height: "2.5rem",
								borderRadius: "9999px",
								border: "2px solid rgba(255, 255, 255, 0.3)",
								overflow: "hidden",
								boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
								backgroundColor: "rgb(15, 23, 42)",
								zIndex: 10,
							}}
						>
							<img
								alt="User Profile"
								style={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
									transition: "transform 300ms",
								}}
								className="group-hover:scale-110"
								src={appStore.user.avatarUrl || "https://placekitten.com/100/100"}
							/>
						</div>
					</div>
					{/* Username Label */}
					<span
						style={{
							fontSize: "0.5625rem",
							fontWeight: 600,
							color: "rgba(255, 255, 255, 0.7)",
							textTransform: "uppercase",
							letterSpacing: "0.03em",
							maxWidth: "5rem",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							textAlign: "center",
						}}
					>
						{(appStore.user.name || "Profile").split(" ")[0]}
					</span>
				</div>

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
