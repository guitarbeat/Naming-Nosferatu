/**
 * @module AdaptiveNav
 * @description Adaptive navigation component - Full-width bottom navigation bar for all screens
 * Uses Scroll Navigation for Single Page Architecture
 */

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, CheckCircle, Lightbulb, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/utils/cn";
import { hapticNavTap, hapticTournamentStart } from "@/utils/ui";

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

type UnifiedButtonState = {
	label: string;
	icon: typeof CheckCircle;
	action: "scroll-top" | "start" | "navigate-pick";
	highlight: boolean;
	disabled: boolean;
};

/**
 * Get the unified button state based on current context
 */
const getUnifiedButtonState = (
	activeSection: string,
	selectedCount: number,
	isTournamentActive: boolean,
	isComplete: boolean,
): UnifiedButtonState => {
	const isOnPickSection = activeSection === "pick";
	const hasEnoughNames = selectedCount >= 2;

	// If tournament is complete, show Analyze
	if (isComplete) {
		return {
			label: "Analyze",
			icon: BarChart3,
			action: "navigate-pick",
			highlight: false,
			disabled: false,
		};
	}

	// If tournament is active, show Pick to go back
	if (isTournamentActive) {
		return {
			label: "Pick",
			icon: CheckCircle,
			action: "navigate-pick",
			highlight: false,
			disabled: false,
		};
	}

	// On pick section with enough names - ready to start
	if (isOnPickSection && hasEnoughNames) {
		return {
			label: `Start (${selectedCount})`,
			icon: Trophy,
			action: "start",
			highlight: true,
			disabled: false,
		};
	}

	// On pick section without enough names
	if (isOnPickSection) {
		return {
			label: "Pick",
			icon: CheckCircle,
			action: "scroll-top",
			highlight: false,
			disabled: false,
		};
	}

	// On other sections - show Start if ready, otherwise Pick
	if (hasEnoughNames) {
		return {
			label: `Start (${selectedCount})`,
			icon: Trophy,
			action: "start",
			highlight: true,
			disabled: false,
		};
	}

	return {
		label: "Pick",
		icon: CheckCircle,
		action: "navigate-pick",
		highlight: false,
		disabled: false,
	};
};

/**
 * Adaptive Bottom Navigation Bar
 * Renders as a full-width bottom navigation bar on all screen sizes
 */
export function AdaptiveNav(_props: AdaptiveNavProps) {
	const appStore = useAppStore();
	const { tournament, tournamentActions } = appStore;
	const { selectedNames } = tournament;
	const [activeSection, setActiveSection] = useState("pick");

	const { isComplete, names: tournamentNames } = tournament;
	const isTournamentActive = !!tournamentNames;
	const selectedCount = selectedNames?.length || 0;

	// Get unified button state
	const buttonState = getUnifiedButtonState(
		activeSection,
		selectedCount,
		isTournamentActive,
		isComplete,
	);

	const handleStartTournament = () => {
		// Trigger distinctive haptic feedback for tournament start
		hapticTournamentStart();

		tournamentActions.resetTournament();
		tournamentActions.setLoading(true);

		if (selectedNames && selectedNames.length >= 2) {
			tournamentActions.setNames(selectedNames);
		}

		setTimeout(() => {
			tournamentActions.setLoading(false);
			const element = document.getElementById("play");
			element?.scrollIntoView({ behavior: "smooth" });
			setActiveSection("play");
		}, 100);
	};

	const handleUnifiedButtonClick = () => {
		if (navigator.vibrate) {
			navigator.vibrate(10);
		}

		switch (buttonState.action) {
			case "start":
				handleStartTournament();
				break;
			case "navigate-pick":
				document.getElementById("pick")?.scrollIntoView({ behavior: "smooth" });
				setActiveSection("pick");
				break;
			case "scroll-top":
				document.getElementById("pick")?.scrollIntoView({ behavior: "smooth" });
				break;
		}
	};

	// Scroll to section handler
	const handleNavClick = (key: string) => {
		const id = keyToId[key];
		if (id) {
			const element = document.getElementById(id);
			if (element) {
				hapticNavTap();
				element.scrollIntoView({ behavior: "smooth" });
				setActiveSection(id);
			}
		}
	};

	// Track active section on scroll
	useEffect(() => {
		const handleScroll = () => {
			const sections = ["pick", "play", "analysis", "suggest"];
			let current = activeSection;
			let minDistance = Infinity;

			for (const id of sections) {
				const element = document.getElementById(id);
				if (element) {
					const rect = element.getBoundingClientRect();
					const distance = Math.abs(rect.top);
					if (distance < minDistance && distance < window.innerHeight * 0.6) {
						minDistance = distance;
						current = id;
					}
				}
			}

			setActiveSection(current);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, [activeSection]);

	const isActive = (key: string) => {
		const targetId = keyToId[key];
		return activeSection === targetId;
	};

	const IconComponent = buttonState.icon;

	return (
		<>
			{/* Profile Avatar - Centered above tournament controls */}
			<motion.div
				className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-0.5"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.1 }}
			>
				<div
					className="group cursor-pointer relative"
					onClick={() => appStore.uiActions.setEditingProfile(true)}
				>
					<div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full blur opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
					<div className="relative w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden shadow-lg bg-slate-900 z-10">
						<img
							alt="User Profile"
							className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
							src={appStore.user.avatarUrl || "https://placekitten.com/100/100"}
						/>
					</div>
				</div>
				<span className="text-[9px] font-semibold text-white/70 uppercase tracking-wider max-w-[5rem] truncate text-center select-none pt-0.5">
					{(appStore.user.name || "Profile").split(" ")[0]}
				</span>
			</motion.div>

			{/* Bottom Navigation Bar */}
			<motion.div
				className="fixed bottom-0 left-0 right-0 z-[100] w-full"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<nav
					className="flex items-center justify-around gap-1 sm:gap-2 px-2 sm:px-4 py-3 bg-black/60 backdrop-blur-xl border-t border-white/10 rounded-t-2xl shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
					role="navigation"
					aria-label="Main navigation"
				>
					{/* Unified Pick/Start Button */}
					<motion.button
						className={cn(
							"relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 p-2 rounded-xl transition-all duration-200",
							isActive("pick") && !buttonState.highlight
								? "text-white bg-white/10"
								: "text-white/50 hover:text-white hover:bg-white/5",
							buttonState.highlight &&
								"text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/40",
						)}
						onClick={handleUnifiedButtonClick}
						disabled={buttonState.disabled}
						type="button"
						animate={
							buttonState.highlight
								? {
										scale: [1, 1.05, 1],
										boxShadow: [
											"0 0 0 rgba(34, 211, 238, 0)",
											"0 0 12px rgba(34, 211, 238, 0.4)",
											"0 0 0 rgba(34, 211, 238, 0)",
										],
									}
								: {}
						}
						transition={
							buttonState.highlight ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}
						}
					>
						<AnimatePresence mode="wait">
							<motion.div
								key={buttonState.icon.name}
								initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
								animate={{ scale: 1, opacity: 1, rotate: 0 }}
								exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
								transition={{ duration: 0.2 }}
							>
								<IconComponent
									className={cn(
										"w-5 h-5 sm:w-6 sm:h-6",
										buttonState.highlight &&
											"text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
									)}
									aria-hidden={true}
								/>
							</motion.div>
						</AnimatePresence>
						<AnimatePresence mode="wait">
							<motion.span
								key={buttonState.label}
								className="text-[10px] sm:text-xs font-medium tracking-wide leading-none"
								initial={{ y: 5, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								exit={{ y: -5, opacity: 0 }}
								transition={{ duration: 0.15 }}
							>
								{buttonState.label}
							</motion.span>
						</AnimatePresence>
						{isActive("pick") && !buttonState.highlight && (
							<motion.div
								layoutId="dockIndicator"
								className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
								initial={false}
								transition={{ type: "spring", stiffness: 500, damping: 30 }}
							/>
						)}
					</motion.button>

					{/* Analyze Button - only show when tournament is complete */}
					{isComplete && (
						<motion.button
							className={cn(
								"relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 p-2 rounded-xl transition-all duration-200",
								isActive("analyze")
									? "text-white bg-white/10"
									: "text-white/50 hover:text-white hover:bg-white/5",
							)}
							onClick={() => handleNavClick("analyze")}
							type="button"
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.2 }}
						>
							<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden={true} />
							<span className="text-[10px] sm:text-xs font-medium tracking-wide leading-none">
								Analyze
							</span>
							{isActive("analyze") && (
								<motion.div
									layoutId="dockIndicator"
									className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
									initial={false}
									transition={{ type: "spring", stiffness: 500, damping: 30 }}
								/>
							)}
						</motion.button>
					)}

					{/* Suggest Button */}
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
		</>
	);
}
