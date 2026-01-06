/**
 * @module TournamentUI
 * @description Consolidated UI components for the Tournament feature.
 * Includes Header, Footer, MatchResult, and RoundTransition.
 */

import { Button, Card, CardBody } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, Keyboard } from "lucide-react";
import { memo } from "react";
import Bracket from "../../../shared/components/Bracket/Bracket";
import type { BracketMatch } from "../../../types/components";

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
						CYCLE {roundNumber} {/* DESIGNATION MATCHING */}
					</span>
					<span className="text-sm md:text-base font-medium text-slate-400 opacity-85">
						Match {currentMatchNumber} of {totalMatches}
					</span>
				</div>
				<div
					className="px-3 py-2 text-sm md:text-base font-bold text-purple-600 bg-gradient-to-br from-purple-500/12 to-purple-500/8 border border-purple-500/25 rounded-full shadow-md transition-all hover:bg-gradient-to-br hover:from-purple-500/15 hover:to-purple-500/10 hover:border-purple-500/30 hover:shadow-lg hover:scale-105"
					aria-label={`Tournament is ${progress}% complete`}
				>
					{progress}% Complete
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
	if (!showMatchResult || !lastMatchResult) return null;

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
	if (!showRoundTransition || !nextRoundNumber) return null;

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

export const TournamentFooter = memo(function TournamentFooter({
	showBracket,
	showKeyboardHelp,
	transformedMatches,
	onToggleBracket,
	onToggleKeyboardHelp,
}: TournamentFooterProps) {
	return (
		<>
			{/* Tournament Controls */}
			<div className="sticky top-0 z-10 flex flex-wrap gap-3 items-center justify-center w-full p-0 m-0 bg-transparent">
				<Button
					className="w-full max-w-[800px] px-4 py-2 text-sm text-slate-300 bg-slate-900/50 border border-white/5 rounded-lg transition-all hover:bg-slate-800/50 hover:-translate-y-0.5 active:translate-y-0"
					onPress={onToggleBracket}
					aria-expanded={showBracket}
					aria-controls="bracketView"
					variant="flat"
					endContent={
						showBracket ? (
							<ChevronDown className="w-4 h-4 transition-transform" />
						) : (
							<ChevronRight className="w-4 h-4 transition-transform" />
						)
					}
				>
					{showBracket ? "Hide Tournament History" : "Show Tournament History"}
				</Button>

				<Button
					className="flex gap-2 items-center justify-center px-4 py-2 text-sm text-slate-300 bg-slate-900/50 border border-white/5 rounded-lg transition-all hover:bg-slate-800/50 hover:-translate-y-0.5 active:translate-y-0"
					onPress={onToggleKeyboardHelp}
					aria-expanded={showKeyboardHelp}
					aria-controls="keyboardHelp"
					variant="flat"
					startContent={<Keyboard className="w-4 h-4" />}
					endContent={
						showKeyboardHelp ? (
							<ChevronDown className="w-4 h-4 transition-transform rotate-90" />
						) : (
							<ChevronRight className="w-4 h-4 transition-transform" />
						)
					}
				>
					Keyboard Shortcuts
				</Button>
			</div>

			{/* Keyboard Help */}
			<AnimatePresence>
				{showKeyboardHelp && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3 }}
						id="keyboardHelp"
						className="p-5 mt-4 bg-gradient-to-br from-white/6 to-white/3 border border-white/12 rounded-2xl shadow-lg backdrop-blur-xl"
						role="complementary"
						aria-label="Keyboard shortcuts help"
					>
						<h3 className="m-0 mb-3 text-lg font-semibold text-slate-200">
							Keyboard Shortcuts
						</h3>
						<ul className="p-0 m-0 list-none">
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									←
								</kbd>
								Select left name
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									→
								</kbd>
								Select right name
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									↑
								</kbd>
								Vote for both names
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									↓
								</kbd>
								Skip this match
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									Space
								</kbd>
								or
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									Enter
								</kbd>
								Vote for selected name
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									Escape
								</kbd>
								Clear selection
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									Tab
								</kbd>
								Navigate between elements
							</li>
							<li className="flex gap-2 items-center py-2 text-slate-400">
								<kbd className="inline-block px-2 py-1 font-mono text-sm font-semibold text-slate-200 bg-slate-800 border border-white/10 rounded shadow-sm">
									C
								</kbd>
								Toggle cat pictures
							</li>
						</ul>
					</motion.div>
				)}
			</AnimatePresence>

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
