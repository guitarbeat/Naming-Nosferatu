/**
 * @module FluidNav
 * @description Fluid navigation component using NavButton for DRY code.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart3, CheckCircle, Layers, LayoutGrid, Lightbulb, Trophy, User } from "@/icons";
import useAppStore from "@/store/appStore";
import { cn, hapticNavTap, hapticTournamentStart } from "@/utils/basic";
import { AnimatedNavButton, NavButton } from "./NavButton";

// Map nav keys to Section IDs
const keyToId: Record<string, string> = {
	pick: "pick",
	play: "play",
	analyze: "analysis",
	suggest: "suggest",
	profile: "profile",
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
 * Fluid Bottom Navigation Bar
 * Renders as a fluid, percentage-width floating dock on all screen sizes
 */
export function FluidNav() {
	const appStore = useAppStore();
	const navigate = useNavigate();
	const location = useLocation();
	const { tournament, tournamentActions, user, ui, uiActions } = appStore;
	const { selectedNames } = tournament;
	const { isLoggedIn, name: userName, avatarUrl } = user;
	const { isSwipeMode } = ui;
	const { setSwipeMode } = uiActions;
	const [activeSection, setActiveSection] = useState("pick");
	const isAnalysisRoute = location.pathname === "/analysis";

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
		hapticTournamentStart();
		if (isAnalysisRoute) {
			navigate("/");
		}
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
				if (isAnalysisRoute) {
					navigate("/");
				} else {
					document.getElementById("pick")?.scrollIntoView({ behavior: "smooth" });
				}
				setActiveSection("pick");
				break;
			case "scroll-top":
				document.getElementById("pick")?.scrollIntoView({ behavior: "smooth" });
				break;
		}
	};

	// Navigate or scroll to section
	const handleNavClick = (key: string) => {
		hapticNavTap();
		if (key === "analyze") {
			navigate("/analysis");
			setActiveSection("analysis");
			return;
		}
		if (key === "pick" && isAnalysisRoute) {
			navigate("/");
			setActiveSection("pick");
			return;
		}
		// Suggest and Profile only exist on home; navigate first if on analysis
		if ((key === "suggest" || key === "profile") && isAnalysisRoute) {
			const id = keyToId[key];
			navigate("/");
			setActiveSection(id);
			requestAnimationFrame(() => {
				setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
			});
			return;
		}
		const id = keyToId[key];
		if (id) {
			const element = document.getElementById(id);
			if (element) {
				element.scrollIntoView({ behavior: "smooth" });
				setActiveSection(id);
			}
		}
	};

	// Sync active section with route (analysis is route-based; home uses scroll)
	useEffect(() => {
		if (location.pathname === "/analysis") {
			setActiveSection("analysis");
		} else if (location.pathname === "/") {
			setActiveSection("pick");
		}
	}, [location.pathname]);

	// Track active section on scroll (home route only)
	useEffect(() => {
		if (location.pathname !== "/" || isAnalysisRoute) {
			return;
		}
		const handleScroll = () => {
			const sections = ["pick", "play", "suggest", "profile"];
			let current = "pick";
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
	}, [location.pathname, isAnalysisRoute]);

	const isActive = (key: string) => {
		const targetId = keyToId[key];
		return activeSection === targetId;
	};

	const IconComponent = buttonState.icon;

	return (
		<motion.nav
			className={cn(
				"fixed z-[100] transition-all duration-500 ease-out",
				"flex items-center justify-evenly gap-4",
				"h-auto py-3 px-6",
				"bottom-0 left-1/2 -translate-x-1/2",
				"w-[95%]",
				"bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
			)}
			initial={{ y: 100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
		>
			{/* Unified Pick/Start Button - Uses AnimatedNavButton for pulse effect */}
			<AnimatedNavButton
				id="pick"
				icon={IconComponent}
				label={buttonState.label}
				isActive={isActive("pick")}
				onClick={handleUnifiedButtonClick}
				highlight={buttonState.highlight}
				disabled={buttonState.disabled}
				animateScale={buttonState.highlight}
				customIcon={
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
				}
			/>

			{/* View Mode Toggle - Shows when on pick section */}
			{isActive("pick") && !isTournamentActive && (
				<motion.button
					initial={{ opacity: 0, scale: 0.8 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.8 }}
					type="button"
					onClick={() => setSwipeMode(!isSwipeMode)}
					className={cn(
						"flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all",
						"text-white/70 hover:text-white hover:bg-white/10",
						isSwipeMode && "bg-purple-500/20 text-purple-400",
					)}
					aria-label={isSwipeMode ? "Switch to grid view" : "Switch to swipe view"}
				>
					<AnimatePresence mode="wait">
						<motion.div
							key={isSwipeMode ? "swipe" : "grid"}
							initial={{ rotate: -90, opacity: 0 }}
							animate={{ rotate: 0, opacity: 1 }}
							exit={{ rotate: 90, opacity: 0 }}
							transition={{ duration: 0.15 }}
						>
							{isSwipeMode ? (
								<Layers className="w-5 h-5" aria-hidden={true} />
							) : (
								<LayoutGrid className="w-5 h-5" aria-hidden={true} />
							)}
						</motion.div>
					</AnimatePresence>
					<span className="text-[10px] font-medium">{isSwipeMode ? "Swipe" : "Grid"}</span>
				</motion.button>
			)}

			{/* Analyze Button - Only shows when tournament complete */}
			{isComplete && (
				<NavButton
					id="analyze"
					icon={BarChart3}
					label="Analyze"
					isActive={isActive("analyze")}
					onClick={() => handleNavClick("analyze")}
				/>
			)}

			{/* Suggest Button */}
			<NavButton
				id="suggest"
				icon={Lightbulb}
				label="Suggest"
				isActive={isActive("suggest")}
				onClick={() => handleNavClick("suggest")}
				ariaLabel="Suggest a name"
			/>

			{/* Profile/Login Button */}
			<NavButton
				id="profile"
				icon={User}
				label={isLoggedIn ? userName?.split(" ")[0] || "Profile" : "Login"}
				isActive={isActive("profile")}
				onClick={() => handleNavClick("profile")}
				ariaLabel={isLoggedIn ? "Edit profile" : "Login"}
				customIcon={
					isLoggedIn && avatarUrl ? (
						<div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
							<img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
						</div>
					) : (
						<User className={cn("w-5 h-5", isLoggedIn && "text-purple-400")} aria-hidden={true} />
					)
				}
				badge={
					isLoggedIn ? (
						<div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black" />
					) : undefined
				}
			/>
		</motion.nav>
	);
}
