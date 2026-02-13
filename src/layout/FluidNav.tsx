// @ts-nocheck
/**
 * @module FluidNav
 * @description Bottom navigation bar with fluid animations and integrated actions.
 */

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, CheckCircle, Layers, LayoutGrid, Lightbulb, LogOut, Trophy, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@/layout/Button";
import { Input, Textarea } from "@/layout/FormPrimitives";
import { useForm } from "@/hooks/useForm";
import { cn } from "@/utils/basic";
import { NavButton, AnimatedNavButton } from "./NavButton";
import useAppStore from "@/store/appStore";
import type { RatingData } from "@/types/appTypes";

export interface FluidNavProps {
    userName?: string;
    isLoggedIn: boolean;
    isAdmin: boolean;
    currentView: string;
    onViewChange: (view: string) => void;
    handleTournamentComplete: (ratings: Record<string, RatingData>) => void;
    onLogin: (name: string) => void;
    onLogout: (callback?: (name: null) => void) => void;
    onUpdateProfile: (updates: any) => void;
}

export function FluidNav({
    userName,
    isLoggedIn,
    isAdmin: _isAdmin,
    currentView,
    onViewChange,
    handleTournamentComplete: _handleTournamentComplete,
    onLogin,
    onLogout,
    onUpdateProfile: _onUpdateProfile
}: FluidNavProps) {
	const navigate = useNavigate();
	const location = useLocation();

    const { ui, uiActions, tournament } = useAppStore();
    const { isSwipeMode, showCatPictures: _showCatPictures } = ui;
    const { setSwipeMode } = uiActions;

	const [activeSection, setActiveSection] = useState(currentView);
	const [isLoginExpanded, setIsLoginExpanded] = useState(false);
	const [isSuggestExpanded, setIsSuggestExpanded] = useState(false);
	const [editedName, setEditedName] = useState(userName || "");
	const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setActiveSection(currentView);
    }, [currentView]);

	const { values, handleChange, handleSubmit, isSubmitting, globalError, successMessage, reset } = useForm({
		initialValues: { name: "", description: "" },
		onSubmit: async (formValues: { name: string, description: string }) => {
			if (!userName) return;
			console.log("Suggesting:", {
                name: formValues.name,
                description: formValues.description,
                suggestedBy: userName
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            setTimeout(() => {
                setIsSuggestExpanded(false);
                reset();
            }, 1500);
		},
	});

	const keyToId: Record<string, string> = {
		pick: "pick",
		play: "play",
		analyze: "analysis",
		suggest: "suggest",
		profile: "profile",
	};

	const handleNavClick = (key: string) => {
		const targetId = keyToId[key];
		if (!targetId) return;

		if (key === "analyze") {
			navigate("/analysis");
		} else {
			if (location.pathname !== "/") {
				navigate("/");
				setTimeout(() => {
					const element = document.getElementById(targetId);
					element?.scrollIntoView({ behavior: "smooth" });
				}, 100);
			} else {
				const element = document.getElementById(targetId);
				element?.scrollIntoView({ behavior: "smooth" });
			}
		}
		setActiveSection(targetId);
        onViewChange(targetId);
	};

	const handleProfileClick = () => {
		setIsLoginExpanded(!isLoginExpanded);
		if (isSuggestExpanded) setIsSuggestExpanded(false);
	};

	const handleSuggestClick = () => {
		setIsSuggestExpanded(!isSuggestExpanded);
		if (isLoginExpanded) setIsLoginExpanded(false);
	};

	const handleLoginSave = async () => {
		if (!editedName.trim()) return;
		setIsSaving(true);
		try {
			await onLogin(editedName);
			setIsLoginExpanded(false);
		} finally {
			setIsSaving(false);
		}
	};

    const handleLogout = () => {
        onLogout(() => {
            setIsLoginExpanded(false);
            setEditedName("");
        });
    };

    const handleSuggestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit(e);
    };

    const isTournamentRoute = location.pathname === "/tournament";
    const isTournamentActive = tournament.names && tournament.names.length > 0;

	const buttonState = useMemo(() => {
		if (isTournamentActive) {
			return {
				label: "Play",
				icon: Trophy,
				highlight: true,
                disabled: false
			};
		}
		const hasSelection = tournament.selectedNames && tournament.selectedNames.length > 0;
		return {
			label: hasSelection ? "Start" : "Pick",
			icon: hasSelection ? Trophy : CheckCircle,
			highlight: hasSelection,
            disabled: !hasSelection && activeSection !== "pick"
		};
	}, [isTournamentActive, tournament.selectedNames, activeSection]);

	const handleUnifiedButtonClick = () => {
		if (isTournamentActive) {
            navigate("/tournament");
		} else if (tournament.selectedNames && tournament.selectedNames.length > 0) {
            if (location.pathname !== "/") navigate("/");
            const element = document.getElementById("pick");
            element?.scrollIntoView({ behavior: "smooth" });
		} else {
            handleNavClick("pick");
        }
	};

	if (isTournamentRoute) {
		return null;
	}

	const IconComponent = buttonState.icon;

	return (
		<>
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
				<AnimatedNavButton
					id="pick"
					icon={IconComponent}
					label={buttonState.label}
					isActive={activeSection === "pick"}
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

				{(activeSection === "pick" || activeSection === "play") && !isTournamentActive && (
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

				{tournament.isComplete && (
					<NavButton
						id="analyze"
						icon={BarChart3}
						label="Analyze"
						isActive={activeSection === "analyze"}
						onClick={() => handleNavClick("analyze")}
					/>
				)}

				<NavButton
					id="suggest"
					icon={Lightbulb}
					label="Idea?"
					isActive={isSuggestExpanded}
					onClick={handleSuggestClick}
					ariaLabel="Suggest a name"
				/>

				<NavButton
					id="profile"
					icon={User}
					label={isLoggedIn ? userName?.split(" ")[0] || "You" : "Name?"}
					isActive={isLoginExpanded}
					onClick={handleProfileClick}
					ariaLabel={isLoggedIn ? "Profile" : "Enter your name"}
					customIcon={
						isLoggedIn ? (
							<User className={cn("w-5 h-5", isLoggedIn && "text-purple-400")} aria-hidden={true} />
						) : (
							<User className={cn("w-5 h-5")} aria-hidden={true} />
						)
					}
					badge={
						isLoggedIn ? (
							<div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black" />
						) : undefined
					}
				/>
			</motion.nav>

			<AnimatePresence>
				{isLoginExpanded && (
					<motion.div
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 100, opacity: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className={cn(
							"fixed z-[99] bottom-24 left-1/2 -translate-x-1/2",
							"w-[95%] max-w-md",
							"bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
							"p-6",
						)}
					>
						{isLoggedIn ? (
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<div className="flex-1">
										<h3 className="text-lg font-bold text-white">{userName}</h3>
										<p className="text-sm text-white/60">Logged in</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="large"
									onClick={handleLogout}
									className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
								>
									<LogOut size={16} />
									Logout
								</Button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="text-center space-y-1">
									<h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
										Who are you?
									</h3>
									<p className="text-sm text-white/60">Enter your name to track rankings</p>
								</div>
								<div className="space-y-3">
									<Input
										type="text"
										value={editedName}
										onChange={(e) => setEditedName(e.target.value)}
										placeholder="Your name..."
										onKeyDown={(e) => e.key === "Enter" && handleLoginSave()}
										className="w-full h-12 px-4 font-medium"
										autoFocus={true}
									/>
									<Button
										variant="gradient"
										size="xl"
										onClick={handleLoginSave}
										disabled={!editedName.trim() || isSaving}
										loading={isSaving}
										className="w-full"
									>
										Let's Go
									</Button>
								</div>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{isSuggestExpanded && (
					<motion.div
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 100, opacity: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className={cn(
							"fixed z-[99] bottom-24 left-1/2 -translate-x-1/2",
							"w-[95%] max-w-md",
							"bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
							"p-6",
						)}
					>
						<form onSubmit={handleSuggestSubmit} className="space-y-4">
							<div className="text-center space-y-1">
								<h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
									Got a name?
								</h3>
								<p className="text-sm text-white/60">Share your brilliant idea</p>
							</div>
							<div className="space-y-3">
								<Input
									type="text"
									value={values.name}
									onChange={(e) => handleChange("name", e.target.value)}
									placeholder="Name..."
									className="w-full h-12 px-4 font-medium"
									autoFocus={true}
								/>
								<Textarea
									value={values.description}
									onChange={(e) => handleChange("description", e.target.value)}
									placeholder="Why is it perfect?"
									rows={3}
									className="w-full px-4 py-3 font-medium resize-none"
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
									type="submit"
									variant="gradient"
									size="xl"
									disabled={!values.name.trim() || !values.description.trim() || isSubmitting}
									loading={isSubmitting}
									className="w-full"
								>
									Submit
								</Button>
							</div>
						</form>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
