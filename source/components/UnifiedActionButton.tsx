/**
 * @module UnifiedActionButton
 * @description A unified action button that intelligently changes based on selection count and current section.
 * Provides consistent behavior across tournament and profile modes.
 */

import { Plus, Users, CheckCircle, Hand, Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { cn } from "@/utils/cn";
import Button from "./Button";
import type { NameItem } from "@/types/components";

export type ActionButtonMode = "tournament" | "profile" | "adaptive-nav";

export type ActionButtonState = {
	selectedCount: number;
	isTournamentActive: boolean;
	isTournamentComplete: boolean;
	minSelectionRequired: number;
};

export interface UnifiedActionButtonProps {
	mode: ActionButtonMode;
	state: ActionButtonState;
	onPickNames?: () => void;
	onStartTournament?: (selectedNames?: NameItem[]) => void;
	onViewSelected?: () => void;
	onAnalyze?: () => void;
	className?: string;
	size?: "small" | "medium" | "large";
	variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "login";
	disabled?: boolean;
	showIcon?: boolean;
}

/**
 * Determines the button configuration based on mode and state
 */
function getButtonConfig(
	mode: ActionButtonMode,
	state: ActionButtonState,
): {
	label: string;
	icon: React.ReactNode;
	variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "login";
	disabled: boolean;
	action: "pick" | "start" | "view" | "analyze";
} {
	const { selectedCount, isTournamentActive, isTournamentComplete, minSelectionRequired } = state;

	// Tournament mode logic
	if (mode === "tournament") {
		if (isTournamentComplete) {
			return {
				label: "Analyze Results",
				icon: <CheckCircle className="w-4 h-4" />,
				variant: "default",
				disabled: false,
				action: "analyze",
			};
		}

		if (isTournamentActive) {
			return {
				label: "Tournament Active",
				icon: <Users className="w-4 h-4" />,
				variant: "secondary",
				disabled: true,
				action: "view",
			};
		}

		if (selectedCount === 0) {
			return {
				label: "Pick Names",
				icon: <Plus className="w-4 h-4" />,
				variant: "secondary",
				disabled: false,
				action: "pick",
			};
		}

		if (selectedCount < minSelectionRequired) {
			return {
				label: `Pick ${minSelectionRequired - selectedCount} More`,
				icon: <Plus className="w-4 h-4" />,
				variant: "secondary",
				disabled: true,
				action: "pick",
			};
		}

		return {
			label: `Start Tournament (${selectedCount})`,
			icon: <Users className="w-4 h-4" />,
			variant: "default",
			disabled: false,
			action: "start",
		};
	}

	// Profile mode logic
	if (mode === "profile") {
		if (selectedCount === 0) {
			return {
				label: "Select Names",
				icon: <Plus className="w-4 h-4" />,
				variant: "ghost",
				disabled: false,
				action: "pick",
			};
		}

		return {
			label: `View Selected (${selectedCount})`,
			icon: <CheckCircle className="w-4 h-4" />,
			variant: "primary",
			disabled: false,
			action: "view",
		};
	}

	// Adaptive nav mode (compact version)
	if (mode === "adaptive-nav") {
		if (isTournamentComplete) {
			return {
				label: "Analyze",
				icon: null,
				variant: "default",
				disabled: false,
				action: "analyze",
			};
		}

		if (isTournamentActive) {
			return {
				label: "Playing",
				icon: null,
				variant: "secondary",
				disabled: true,
				action: "view",
			};
		}

		if (selectedCount < minSelectionRequired) {
			return {
				label: `Pick ${minSelectionRequired - selectedCount}+`,
				icon: <Hand className="w-5 h-5 sm:w-6 sm:h-6" />,
				variant: "secondary",
				disabled: true,
				action: "pick",
			};
		}

		return {
			label: `Start (${selectedCount})`,
			icon: <Play className="w-5 h-5 sm:w-6 sm:h-6" />,
			variant: "primary",
			disabled: false,
			action: "start",
		};
	}

	// Fallback
	return {
		label: "Action",
		icon: <Plus className="w-4 h-4" />,
		variant: "ghost",
		disabled: false,
		action: "pick",
	};
}

/**
 * Unified Action Button Component
 * Intelligently displays different actions based on current context and selection state
 */
export function UnifiedActionButton({
	mode,
	state,
	onPickNames,
	onStartTournament,
	onViewSelected,
	onAnalyze,
	className = "",
	size = "medium",
	variant: overrideVariant,
	disabled: overrideDisabled,
	showIcon = true,
}: UnifiedActionButtonProps) {
	const config = getButtonConfig(mode, state);

	// Allow overriding variant and disabled state
	const finalVariant = overrideVariant || config.variant;
	const finalDisabled = overrideDisabled !== undefined ? overrideDisabled : config.disabled;

	const handleClick = () => {
		switch (config.action) {
			case "pick":
				onPickNames?.();
				break;
			case "start":
				onStartTournament?.();
				break;
			case "view":
				onViewSelected?.();
				break;
			case "analyze":
				onAnalyze?.();
				break;
		}
	};

	// For adaptive nav, render a simpler button
	if (mode === "adaptive-nav") {
		const { selectedCount, minSelectionRequired } = state;
		const showProgress = selectedCount < minSelectionRequired;
		const iconKey =
			config.action === "pick" ? "pick" : config.action === "start" ? "start" : "default";

		return (
			<button
				type="button"
				onClick={handleClick}
				disabled={finalDisabled}
				className={cn(
					"relative flex flex-col items-center justify-center flex-1 min-w-0 gap-1 p-2 rounded-xl transition-all duration-200",
					finalDisabled
						? "opacity-40 cursor-not-allowed text-white/50"
						: finalVariant === "primary" || finalVariant === "default"
							? "text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 hover:bg-cyan-900/40"
							: "text-white/50 hover:text-white hover:bg-white/5",
					className,
				)}
				aria-label={config.label}
			>
				{/* Icon with morphing animation */}
				{config.icon && (
					<AnimatePresence mode="wait">
						<motion.div
							key={iconKey}
							layoutId="adaptive-nav-icon"
							initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
							animate={{ scale: 1, opacity: 1, rotate: 0 }}
							exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
							transition={{
								type: "spring",
								stiffness: 400,
								damping: 25,
								layout: { duration: 0.4, ease: "easeInOut" },
							}}
							className={cn(
								finalVariant === "default" &&
									"text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]",
							)}
							aria-hidden={true}
						>
							{config.icon}
						</motion.div>
					</AnimatePresence>
				)}
				<span className="text-[10px] sm:text-xs font-medium tracking-wide leading-none">
					{config.label}
				</span>
				{showProgress && (
					<span className="text-[8px] sm:text-[9px] font-bold text-orange-400 leading-none">
						{selectedCount}/{minSelectionRequired}
					</span>
				)}
			</button>
		);
	}

	// Standard button for other modes
	const { selectedCount, minSelectionRequired } = state;
	const showProgress = selectedCount < minSelectionRequired;

	return (
		<Button
			variant={finalVariant}
			size={size}
			onClick={handleClick}
			disabled={finalDisabled}
			className={cn(
				"relative inline-flex items-center justify-center gap-2 font-bold uppercase tracking-wider rounded-full transition-all duration-300",
				config.action === "start" &&
					"bg-gradient-to-br from-purple-600 to-purple-800 text-white border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(168,85,247,0.6)]",
				config.action === "pick" &&
					"bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:text-white",
				config.action === "view" &&
					"bg-gradient-to-br from-cyan-600 to-cyan-800 text-white border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(34,211,238,0.4)]",
				config.action === "analyze" &&
					"bg-gradient-to-br from-green-600 to-green-800 text-white border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(34,197,94,0.4)]",
				finalDisabled && "grayscale opacity-50 cursor-not-allowed",
				className,
			)}
			startIcon={showIcon ? config.icon : null}
			aria-label={config.label}
		>
			{config.label}
			{showProgress && (
				<span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 leading-none">
					{selectedCount}/{minSelectionRequired}
				</span>
			)}
		</Button>
	);
}

export default UnifiedActionButton;
