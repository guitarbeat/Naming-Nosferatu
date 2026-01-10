/**
 * @module TournamentUI
 * @description Consolidated UI components for the Tournament feature.
 * Includes Header, Footer, MatchResult, and RoundTransition.
 */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Keyboard } from "lucide-react";
import React, { memo, useEffect } from "react";
import Bracket from "../../../shared/components/Bracket";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card/Card";
import type { BracketMatch } from "../../../types/components";

const CardBody = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={className} {...props}>
		{children}
	</div>
);

import { KeyboardHelp } from "./KeyboardHelp";

// --- Types ---

export interface TournamentHeaderProps {
	roundNumber?: number;
	currentMatchNumber?: number;
	totalMatches?: number;
	progress?: number;
}

export interface MatchResultProps {
	showMatchResult: boolean;
	lastMatchResult: string | null;
	roundNumber: number;
	currentMatchNumber: number;
	totalMatches: number;
}

export interface RoundTransitionProps {
	showRoundTransition: boolean;
	nextRoundNumber: number | null;
}

export interface ProgressMilestoneProps {
	progress: number;
	onDismiss: () => void;
}

export interface TournamentFooterProps {
	showBracket: boolean;
	showKeyboardHelp: boolean;
	transformedMatches: BracketMatch[];
	onToggleBracket: () => void;
	onToggleKeyboardHelp: () => void;
}

// --- Components ---

export const TournamentHeader = memo(function TournamentHeader({
	roundNumber,
	currentMatchNumber,
	totalMatches,
	progress,
}: TournamentHeaderProps) {
	const eloTooltipText =
		"Each vote updates name rankings using the Elo rating system (same as chess rankings). Your preferences determine which names rank highest!";

	return (
		<Card
			className="w-full max-w-full mb-4 p-3 bg-gradient-to-br from-white/8 to-white/4 border border-white/15 rounded-lg shadow-lg backdrop-blur-xl transition-all hover:shadow-xl hover:-translate-y-0.5"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<CardBody className="flex flex-row items-center justify-between gap-4 p-0">
				<div className="flex flex-row flex-wrap items-center gap-3">
					<span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">
						Round {roundNumber}
					</span>
					<span
						className="text-sm md:text-base font-medium text-slate-400 opacity-85 cursor-help"
						title="Current matchup in this round"
						aria-label={`Match ${currentMatchNumber} of ${totalMatches} in round ${roundNumber}`}
					>
						Match {currentMatchNumber} of {totalMatches}
					</span>
				</div>
				<div
					className="px-3 py-2 text-sm md:text-base font-bold text-purple-600 bg-gradient-to-br from-purple-500/12 to-purple-500/8 border border-purple-500/25 rounded-full shadow-md transition-all hover:bg-gradient-to-br hover:from-purple-500/15 hover:to-purple-500/10 hover:border-purple-500/30 hover:shadow-lg hover:scale-105 cursor-help relative group"
					aria-label={`Tournament is ${progress}% complete. ${eloTooltipText}`}
					title={eloTooltipText}
				>
					{progress}% Complete
					<span
						className="absolute -top-1 -right-1 text-xs opacity-60 group-hover:opacity-100 transition-opacity"
						aria-hidden="true"
					>
						ℹ️
					</span>
				</div>
			</CardBody>
		</Card>
	);
});

export const MatchResult = memo(function MatchResult({
	showMatchResult,
	lastMatchResult,
	roundNumber,
	currentMatchNumber,
	totalMatches,
}: MatchResultProps) {
	if (!showMatchResult || !lastMatchResult) {
		return null;
	}

	return (
		<AnimatePresence>
			{showMatchResult && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{ duration: 0.5, ease: [0.68, -0.55, 0.265, 1.55] }}
					className="fixed right-8 bottom-8 z-[1000] max-w-[350px] p-4 md:p-6 text-lg text-white bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-300 rounded-lg shadow-lg"
					role="status"
					aria-live="polite"
				>
					<div className="flex flex-col gap-2">
						<span className="flex gap-2 items-center font-semibold">
							<span className="text-2xl">🏆</span>
							{lastMatchResult}
						</span>
						<span className="text-sm font-medium text-purple-100 opacity-90">
							Round {roundNumber} - Match {currentMatchNumber} of {totalMatches}
						</span>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});

export const RoundTransition = memo(function RoundTransition({
	showRoundTransition,
	nextRoundNumber,
}: RoundTransitionProps) {
	if (!showRoundTransition || !nextRoundNumber) {
		return null;
	}

	return (
		<AnimatePresence>
			{showRoundTransition && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
					role="status"
					aria-live="polite"
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.5, ease: [0.68, -0.55, 0.265, 1.55] }}
						className="flex flex-col gap-6 items-center p-6 md:p-8 text-white text-center bg-gradient-to-br from-purple-500 to-purple-600 border-3 border-purple-300 rounded-2xl shadow-2xl"
					>
						<motion.div
							animate={{ y: [0, -10, 0] }}
							transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
							className="text-6xl md:text-7xl"
						>
							🏆
						</motion.div>
						<h2 className="m-0 text-3xl md:text-4xl font-bold text-shadow-lg">
							Round {nextRoundNumber}
						</h2>
						<p className="m-0 text-lg md:text-xl font-medium text-purple-100 opacity-90">
							Tournament continues...
						</p>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
});

export const ProgressMilestone = memo(function ProgressMilestone({
	progress,
	onDismiss,
}: ProgressMilestoneProps) {
	const [hasShown50, setHasShown50] = React.useState(false);
	const [hasShown80, setHasShown80] = React.useState(false);
	const [showMilestone, setShowMilestone] = React.useState(false);
	const [milestoneMessage, setMilestoneMessage] = React.useState("");

	useEffect(() => {
		if (progress >= 50 && !hasShown50) {
			setHasShown50(true);
			setMilestoneMessage("Halfway there! 🎉");
			setShowMilestone(true);
			const timer = setTimeout(() => {
				setShowMilestone(false);
			}, 2500);
			return () => clearTimeout(timer);
		}
		if (progress >= 80 && !hasShown80) {
			setHasShown80(true);
			setMilestoneMessage("Almost done! 🚀");
			setShowMilestone(true);
			const timer = setTimeout(() => {
				setShowMilestone(false);
			}, 2500);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [progress, hasShown50, hasShown80]);

	if (!showMilestone) {
		return null;
	}

	return (
		<AnimatePresence>
			{showMilestone && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
					transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
					className="fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 text-lg font-bold text-white bg-gradient-to-br from-green-500 to-emerald-600 border-2 border-green-300 rounded-full shadow-2xl"
					style={{
						zIndex: "var(--z-toast)",
						top: "var(--space-20)",
						padding: "var(--space-3) var(--space-6)",
						fontSize: "var(--text-lg)",
						fontWeight: "var(--font-weight-bold)",
						borderRadius: "var(--radius-full)",
						boxShadow: "var(--shadow-xl)",
						background:
							"linear-gradient(135deg, var(--color-success), color-mix(in srgb, var(--color-success) 90%, var(--color-neutral-900)))",
						borderColor: "var(--color-success)",
					}}
					role="status"
					aria-live="polite"
					onClick={onDismiss}
				>
					{milestoneMessage}
				</motion.div>
			)}
		</AnimatePresence>
	);
});

export const TournamentFooter = memo(function TournamentFooter({
	showBracket,
	showKeyboardHelp,
	transformedMatches,
	onToggleBracket,
	onToggleKeyboardHelp,
}: TournamentFooterProps) {
	const [hasSeenBracketHint, setHasSeenBracketHint] = React.useState(() => {
		if (typeof window === "undefined") {
			return true;
		}
		const userStorage = localStorage.getItem("user-storage");
		return userStorage ? JSON.parse(userStorage)?.hasSeenBracketHint : false;
	});
	const [showBracketHint, setShowBracketHint] = React.useState(false);

	useEffect(() => {
		if (!hasSeenBracketHint && transformedMatches.length >= 2 && !showBracket) {
			const timer = setTimeout(() => {
				setShowBracketHint(true);
			}, 3000);
			return () => clearTimeout(timer);
		}
		return undefined;
	}, [hasSeenBracketHint, transformedMatches.length, showBracket]);

	const handleBracketToggle = () => {
		if (showBracketHint) {
			setShowBracketHint(false);
			setHasSeenBracketHint(true);
			const userStorage = JSON.parse(localStorage.getItem("user-storage") || "{}");
			userStorage.hasSeenBracketHint = true;
			localStorage.setItem("user-storage", JSON.stringify(userStorage));
		}
		onToggleBracket();
	};

	return (
		<>
			{/* Tournament Controls */}
			<div className="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-center w-full p-0 m-0 bg-transparent">
				<div className="relative w-full max-w-[800px]">
					<Button
						className="w-full px-4 py-2 text-sm text-slate-300 bg-slate-900/50 border border-white/5 rounded-lg transition-all hover:bg-slate-800/50 hover:-translate-y-0.5 active:translate-y-0"
						onClick={handleBracketToggle}
						aria-expanded={showBracket}
						aria-controls="bracketView"
						variant="secondary"
						endIcon={
							showBracket ? (
								<ChevronDown className="w-4 h-4 transition-transform" />
							) : (
								<ChevronRight className="w-4 h-4 transition-transform" />
							)
						}
					>
						{showBracket ? "Hide Tournament History" : "Show Tournament History"}
					</Button>
					{showBracketHint && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-20"
							style={{
								color: "var(--text-secondary)",
								backgroundColor: "var(--glass-bg-strong)",
								border: "1px solid var(--glass-border)",
								borderRadius: "var(--radius-lg)",
								boxShadow: "var(--shadow-md)",
								padding: "var(--space-2) var(--space-3)",
								fontSize: "var(--text-xs)",
							}}
						>
							💡 View your tournament bracket history below
							<span
								className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
								style={{
									backgroundColor: "var(--glass-bg-strong)",
									borderLeft: "1px solid var(--glass-border)",
									borderTop: "1px solid var(--glass-border)",
								}}
							/>
						</motion.div>
					)}
				</div>

				<Button
					className="flex gap-2 items-center justify-center px-4 py-2 text-sm text-slate-300 bg-slate-900/50 border border-white/5 rounded-lg transition-all hover:bg-slate-800/50 hover:-translate-y-0.5 active:translate-y-0"
					onClick={onToggleKeyboardHelp}
					aria-expanded={showKeyboardHelp}
					aria-controls="keyboardHelp"
					variant="secondary"
					startIcon={<Keyboard className="w-4 h-4" />}
				>
					Keyboard Shortcuts
				</Button>
			</div>

			{/* Keyboard Help */}
			<KeyboardHelp show={showKeyboardHelp} />

			{/* Bracket View */}
			<AnimatePresence>
				{showBracket && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3 }}
						id="bracketView"
						className="relative p-6 mt-4 overflow-x-auto bg-gradient-to-br from-white/6 to-white/3 border border-white/12 rounded-2xl shadow-lg backdrop-blur-xl"
						role="complementary"
						aria-label="Tournament bracket history"
					>
						<Bracket matches={transformedMatches} />
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
});
