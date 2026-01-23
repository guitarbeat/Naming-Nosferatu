/**
 * @module AdaptiveNav
 * @description Adaptive navigation component - Full-width bottom navigation bar for all screens
 * Uses Scroll Navigation for Single Page Architecture
 */

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { getBottomNavItems, MAIN_NAV_ITEMS } from "@/navigation";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/utils/cn";

interface AdaptiveNavProps {
	onOpenSuggestName?: () => void;
}

// Map nav keys to Section IDs
const keyToId: Record<string, string> = {
	pick: "pick",
	play: "play",
	analyze: "analysis",
	suggest: "suggest",
};

/**
 * Adaptive Bottom Navigation Bar
 * Renders as a full-width bottom navigation bar on all screen sizes
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
			const sections = ["pick", "play", "analysis", "suggest"];

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
	const visibleBottomItems = tournament.isComplete ? ["pick", "analyze"] : ["pick", "play"];

	const bottomNavItems = getBottomNavItems(MAIN_NAV_ITEMS, visibleBottomItems);

	return (
		<motion.div
			className="fixed bottom-0 left-0 right-0 z-50 w-full"
			initial={{ y: 20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<nav
				className="flex items-center justify-around gap-1 sm:gap-2 px-2 sm:px-4 py-3 bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-t-2xl shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
				role="navigation"
				aria-label="Main navigation"
			>
				{/* Central Avatar Button - User Profile */}
				<div className="flex flex-col items-center gap-0.5 relative flex-1 max-w-[80px]">
					<div
						className="group cursor-pointer relative"
						onClick={() => appStore.uiActions.setEditingProfile(true)}
					>
						{/* Glow effect */}
						<div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
						{/* Avatar container */}
						<div className="relative w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden shadow-lg bg-slate-900 z-10">
							<img
								alt="User Profile"
								className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
								src={appStore.user.avatarUrl || "https://placekitten.com/100/100"}
							/>
						</div>
					</div>
					{/* Username Label */}
					<span className="text-[9px] font-semibold text-white/70 uppercase tracking-wider max-w-[5rem] truncate text-center select-none pt-0.5">
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
							className={cn(
								"relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 p-2 rounded-xl transition-all duration-200",
								itemActive
									? "text-white bg-white/10"
									: "text-white/50 hover:text-white hover:bg-white/5",
								isDisabled &&
									"opacity-40 cursor-not-allowed hover:bg-transparent hover:text-white/50",
								isHighlight &&
									"text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/40",
							)}
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
												"0 0 0 rgba(34, 211, 238, 0)",
												"0 0 10px rgba(34, 211, 238, 0.3)",
												"0 0 0 rgba(34, 211, 238, 0)",
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
							{item.icon && (
								<item.icon
									className={cn(
										"w-5 h-5 sm:w-6 sm:h-6",
										isHighlight && "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
									)}
									aria-hidden={true}
								/>
							)}
							<span className="text-[10px] sm:text-xs font-medium tracking-wide leading-none">
								{label}
							</span>
							{itemActive && (
								<motion.div
									layoutId="dockIndicator"
									className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
									initial={false}
									transition={{ type: "spring", stiffness: 500, damping: 30 }}
								/>
							)}
						</motion.button>
					);
				})}

				{/* Inline Suggestion Trigger */}
				<button
					className={cn(
						"relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 p-2 rounded-xl transition-all duration-200",
						isActive("suggest")
							? "text-white bg-white/10"
							: "text-white/50 hover:text-white hover:bg-white/5",
					)}
					onClick={() => handleNavClick("suggest")}
					aria-label="Suggest a name"
					type="button"
				>
					<Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden={true} />
					<span className="text-[10px] sm:text-xs font-medium tracking-wide leading-none">
						Suggest
					</span>
					{isActive("suggest") && (
						<motion.div
							layoutId="dockIndicator"
							className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
							initial={false}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
						/>
					)}
				</button>
			</nav>
		</motion.div>
	);
}
