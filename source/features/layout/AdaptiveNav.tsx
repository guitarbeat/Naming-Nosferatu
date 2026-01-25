/**
 * @module AdaptiveNav
 * @description Adaptive navigation component - Full-width bottom navigation bar for all screens
 * Uses Scroll Navigation for Single Page Architecture
 */

import { cn } from "@utils";
import { hapticNavTap, hapticTournamentStart } from "@utils/ui";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, CheckCircle, Lightbulb, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import useAppStore from "@/store/useAppStore";

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
export function AdaptiveNav() {
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
		<motion.nav
			className={cn(
				"fixed z-[100] flex items-center transition-all duration-500 ease-out",
				"h-auto max-h-[120px]", // Limit height
				// Mobile Styles: Bottom Sheet
				"bottom-0 !bottom-0 top-auto !top-auto inset-x-0 justify-around gap-1 px-2 py-3 bg-black/80 backdrop-blur-xl border-t border-white/10 rounded-t-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]",
				// Desktop Styles: Floating Dock
				"md:bottom-8 md:!bottom-8 md:top-auto md:!top-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] md:justify-center md:gap-2 md:px-6 md:py-3 md:rounded-2xl md:border md:border-white/10 md:shadow-2xl md:pb-3",
			)}
			style={{
				bottom: 0,
				top: "auto",
				maxHeight: "120px",
			}}
			initial={{ y: 100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
		>
			{/* Unified Pick/Start Button */}
			<motion.button
				className={cn(
					"relative flex flex-col items-center justify-center flex-1 md:flex-none md:w-24 gap-1 p-2 rounded-xl transition-all",
					isActive("pick") && !buttonState.highlight
						? "text-white bg-white/10"
						: "text-white/50 hover:text-white hover:bg-white/5",
					buttonState.highlight && "text-cyan-400 bg-cyan-950/30 border border-cyan-500/30",
				)}
				onClick={handleUnifiedButtonClick}
				disabled={buttonState.disabled}
				type="button"
				animate={buttonState.highlight ? { scale: [1, 1.05, 1] } : {}}
				transition={buttonState.highlight ? { duration: 2, repeat: Infinity } : {}}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={buttonState.icon.name}
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.8, opacity: 0 }}
					>
						<IconComponent
							className={cn("w-5 h-5", buttonState.highlight && "text-cyan-400")}
							aria-hidden={true}
						/>
					</motion.div>
				</AnimatePresence>
				<span className="text-[10px] font-medium tracking-wide">{buttonState.label}</span>
				{isActive("pick") && !buttonState.highlight && (
					<motion.div
						layoutId="dockIndicator"
						className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full"
					/>
				)}
			</motion.button>

			{/* Analyze Button */}
			{isComplete && (
				<motion.button
					className={cn(
						"relative flex flex-col items-center justify-center flex-1 md:flex-none md:w-24 gap-1 p-2 rounded-xl transition-all",
						isActive("analyze")
							? "text-white bg-white/10"
							: "text-white/50 hover:text-white hover:bg-white/5",
					)}
					onClick={() => handleNavClick("analyze")}
					type="button"
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
				>
					<BarChart3 className="w-5 h-5" aria-hidden={true} />
					<span className="text-[10px] font-medium tracking-wide">Analyze</span>
					{isActive("analyze") && (
						<motion.div
							layoutId="dockIndicator"
							className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full"
						/>
					)}
				</motion.button>
			)}

			{/* Suggest Button */}
			<button
				className={cn(
					"relative flex flex-col items-center justify-center flex-1 md:flex-none md:w-24 gap-1 p-2 rounded-xl transition-all",
					isActive("suggest")
						? "text-white bg-white/10"
						: "text-white/50 hover:text-white hover:bg-white/5",
				)}
				onClick={() => handleNavClick("suggest")}
				type="button"
				aria-label="Suggest a name"
			>
				<Lightbulb className="w-5 h-5" aria-hidden={true} />
				<span className="text-[10px] font-medium tracking-wide">Suggest</span>
				{isActive("suggest") && (
					<motion.div
						layoutId="dockIndicator"
						className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/80 rounded-b-full"
					/>
				)}
			</button>
		</motion.nav>
	);
}
