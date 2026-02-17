/**
 * @module FloatingNavbar
 * @description modern, bottom-fixed floating navigation bar with hover-expand logic
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/Providers";
import { useNameSuggestion } from "@/hooks/useNames";
import Button from "@/shared/components/layout/Button";
import { Input, Textarea } from "@/shared/components/layout/FormPrimitives";
import { cn, hapticNavTap, hapticTournamentStart } from "@/shared/lib/basic";
import {
	BarChart3,
	CheckCircle,
	Layers,
	LayoutGrid,
	Lightbulb,
	LogOut,
	Trophy,
	User,
} from "@/shared/lib/icons";
import useAppStore from "@/store/appStore";

// Map nav keys to Section IDs
const keyToId: Record<string, string> = {
	pick: "pick",
	play: "play",
	analyze: "analysis",
	suggest: "suggest",
	profile: "profile",
};

/**
 * Floating Navigation Item Component
 */
function FloatingNavItem({
	icon: Icon,
	label,
	isActive,
	onClick,
	customIcon,
	className,
}: {
	icon: any;
	label: string;
	isActive?: boolean;
	onClick: () => void;
	customIcon?: React.ReactNode;
	className?: string;
}) {
	return (
		<motion.div
			className={cn(
				"group flex items-center justify-center gap-0 hover:gap-3 p-2.5 cursor-pointer transition-all duration-300 ease-in-out border-radius-[30px] rounded-full overflow-hidden w-[44px] hover:w-[140px] bg-transparent text-white/70 hover:text-white hover:bg-white/20",
				isActive && "bg-white/10 text-white",
				className
			)}
			onClick={onClick}
		>
			<div className="flex-shrink-0 flex items-center justify-center">
				{customIcon || <Icon className="w-6 h-6" />}
			</div>
			<span className="hidden group-hover:block text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				{label}
			</span>
		</motion.div>
	);
}

export function FloatingNavbar() {
	const appStore = useAppStore();
	const navigate = useNavigate();
	const location = useLocation();
	const { login, logout } = useAuth();
	const { tournament, tournamentActions, user, ui, uiActions, userActions } = appStore;
	const { selectedNames } = tournament;
	const { isLoggedIn, name: userName, avatarUrl, isAdmin } = user;
	const { isSwipeMode } = ui;
	const { setSwipeMode } = uiActions;
	const [activeSection, setActiveSection] = useState("pick");
	const [isLoginExpanded, setIsLoginExpanded] = useState(false);
	const [isSuggestExpanded, setIsSuggestExpanded] = useState(false);
	const [editedName, setEditedName] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const isAnalysisRoute = location.pathname === "/analysis";
	const isTournamentRoute = location.pathname === "/tournament";

	const selectedCount = selectedNames?.length || 0;
	const isTournamentActive = !!tournament?.names;
	const isComplete = tournament?.isComplete;

	const { values, isSubmitting, handleChange, handleSubmit, globalError, successMessage } =
		useNameSuggestion({
			onSuccess: () => {
				setTimeout(() => setIsSuggestExpanded(false), 2000);
			},
		});

	const handleStartTournament = () => {
		hapticTournamentStart();
		if (selectedNames && selectedNames.length >= 2) {
			tournamentActions.setNames(selectedNames);
			navigate("/tournament");
		}
	};

	const handleNavClick = (key: string) => {
		hapticNavTap();
		if (key === "analyze") {
			navigate("/analysis");
			return;
		}
		if (key === "pick" && isAnalysisRoute) {
			navigate("/");
			return;
		}

		const id = keyToId[key];
		if (id) {
			if (location.pathname !== "/") {
				navigate("/");
				setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
			} else {
				document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
			}
		}
	};

	const handleLoginSave = async () => {
		if (!editedName.trim()) return;
		setIsSaving(true);
		try {
			const success = await login({ name: editedName.trim() });
			if (success) {
				userActions.login(editedName.trim());
				setIsLoginExpanded(false);
				setEditedName("");
			}
		} finally {
			setIsSaving(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		userActions.logout();
		setIsLoginExpanded(false);
	};

	// Track active section on scroll (home route only)
	useEffect(() => {
		if (location.pathname !== "/" || isAnalysisRoute) {
			return;
		}
		let rafId: number | null = null;
		const handleScroll = () => {
			if (rafId) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
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
			});
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (rafId) cancelAnimationFrame(rafId);
		};
	}, [location.pathname, isAnalysisRoute]);

	if (isTournamentRoute) return null;

	return (
		<>
			<nav
				className={cn(
					"fixed bottom-5 left-1/2 -translate-x-1/2 z-[100]",
					"bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1.5 flex gap-1.5 transition-all duration-300",
					"shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
				)}
			>
				{/* Tournament Controller */}
				{!isComplete && !isTournamentActive && (
					<FloatingNavItem
						icon={selectedCount >= 2 ? Trophy : CheckCircle}
						label={selectedCount >= 2 ? `Start (${selectedCount})` : "Pick Names"}
						isActive={activeSection === "pick"}
						onClick={() => (selectedCount >= 2 ? handleStartTournament() : handleNavClick("pick"))}
						className={cn(selectedCount >= 2 && "text-amber-400 hover:text-amber-300")}
					/>
				)}

				{isComplete && (
					<FloatingNavItem
						icon={BarChart3}
						label="Analyze"
						isActive={isAnalysisRoute}
						onClick={() => handleNavClick("analyze")}
					/>
				)}

				{/* View Toggle */}
				<FloatingNavItem
					icon={isSwipeMode ? Layers : LayoutGrid}
					label={isSwipeMode ? "Grid Mode" : "Swipe Mode"}
					onClick={() => setSwipeMode(!isSwipeMode)}
				/>

				{/* Suggest */}
				<FloatingNavItem
					icon={Lightbulb}
					label="Add Idea"
					isActive={isSuggestExpanded}
					onClick={() => {
						setIsSuggestExpanded(!isSuggestExpanded);
						setIsLoginExpanded(false);
					}}
				/>

				{/* Profile */}
				<FloatingNavItem
					icon={User}
					label={isLoggedIn ? (userName?.split(" ")[0] || "Profile") : "Login"}
					isActive={isLoginExpanded}
					onClick={() => {
						setIsLoginExpanded(!isLoginExpanded);
						setIsSuggestExpanded(false);
					}}
					customIcon={
						isLoggedIn && avatarUrl ? (
							<img src={avatarUrl} alt={userName} className="w-6 h-6 rounded-full object-cover border border-white/20" />
						) : (
							<User className={cn("w-6 h-6", isLoggedIn && isAdmin && "text-amber-400", isLoggedIn && !isAdmin && "text-purple-400")} />
						)
					}
				/>
			</nav>

			{/* Shared Modal Backdrops and Panels (Reused from FluidNav logic) */}
			<AnimatePresence>
				{isLoginExpanded && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 20, opacity: 0 }}
						className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[101] w-[90vw] max-w-md bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
					>
						{isLoggedIn ? (
							<div className="flex flex-col items-center gap-6">
								<h3 className="text-xl font-bold text-white">Hi, {userName}! {isAdmin && "👑"}</h3>
								<Button variant="ghost" className="text-red-400" onClick={handleLogout}>
									<LogOut size={18} className="mr-2" /> Logout
								</Button>
							</div>
						) : (
							<div className="space-y-6">
								<div className="text-center">
									<h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Login</h3>
									<p className="text-white/60 text-sm">Join the tournament!</p>
								</div>
								<Input
									value={editedName}
									onChange={(e) => setEditedName(e.target.value)}
									placeholder="Your name..."
									className="text-lg"
								/>
								<Button
									variant="gradient"
									className="w-full h-12"
									onClick={handleLoginSave}
									disabled={!editedName || isSaving}
									loading={isSaving}
								>
									Continue
								</Button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isSuggestExpanded && (
					<motion.div
						initial={{ y: 20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 20, opacity: 0 }}
						className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[101] w-[95%] max-w-md bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl"
					>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleSubmit();
							}}
							className="space-y-4"
						>
							<div className="text-center space-y-1">
								<h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
									Got a name?
								</h3>
								<p className="text-sm text-white/60">Share your brilliant idea</p>
							</div>
							<Input
								value={values.name}
								onChange={(e) => handleChange("name", e.target.value)}
								placeholder="Name..."
							/>
							<Textarea
								value={values.description}
								onChange={(e) => handleChange("description", e.target.value)}
								placeholder="Why is it good?"
								rows={3}
							/>
							{globalError && (
								<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm font-medium text-center">
									{globalError}
								</div>
							)}
							{successMessage && (
								<div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-200 text-sm font-medium text-center">
									{successMessage}
								</div>
							)}
							<Button
								variant="gradient"
								className="w-full"
								type="submit"
								disabled={!values.name || isSubmitting}
								loading={isSubmitting}
							>
								Suggest
							</Button>
						</form>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
