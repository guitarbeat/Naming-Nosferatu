/**
 * @module TournamentUI
 * @description Consolidated UI components for the Tournament feature.
 * Includes Header, Footer, MatchResult, and RoundTransition.
 */

import React, { memo } from "react";
import Bracket from "../../../shared/components/Bracket/Bracket";
import Card from "../../../shared/components/Card/Card";
import styles from "../Tournament.module.css";

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
	transformedMatches: unknown[];
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
			className={styles.progressInfo}
			background="glass"
			padding="none"
			shadow="medium"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<div className={styles.roundInfo}>
				<span className={styles.roundNumber}>Round {roundNumber}</span>
				<span className={styles.matchCount}>
					Match {currentMatchNumber} of {totalMatches}
				</span>
			</div>
			<div
				className={styles.percentageInfo}
				aria-label={`Tournament is ${progress}% complete`}
			>
				{progress}% Complete
			</div>
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
		<div className={styles.matchResult} role="status" aria-live="polite">
			<div className={styles.resultContent}>
				<span className={styles.resultMessage}>{lastMatchResult}</span>
				<span className={styles.tournamentProgress}>
					Round {roundNumber} - Match {currentMatchNumber} of {totalMatches}
				</span>
			</div>
		</div>
	);
});

export const RoundTransition = memo(function RoundTransition({
	showRoundTransition,
	nextRoundNumber,
}: RoundTransitionProps) {
	if (!showRoundTransition || !nextRoundNumber) return null;

	return (
		<div className={styles.roundTransition} role="status" aria-live="polite">
			<div className={styles.transitionContent}>
				<div className={styles.roundIcon}>🏆</div>
				<h2 className={styles.roundTitle}>Round {nextRoundNumber}</h2>
				<p className={styles.roundSubtitle}>Tournament continues...</p>
			</div>
		</div>
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
			<div className={styles.tournamentControls}>
				<button
					className={styles.bracketToggle}
					onClick={onToggleBracket}
					aria-expanded={showBracket}
					aria-controls="bracketView"
					type="button"
				>
					{showBracket ? "Hide Tournament History" : "Show Tournament History"}
					<span className={styles.bracketToggleIcon}>
						{showBracket ? "▼" : "▶"}
					</span>
				</button>

				<button
					className={styles.keyboardHelpToggle}
					onClick={onToggleKeyboardHelp}
					aria-expanded={showKeyboardHelp}
					aria-controls="keyboardHelp"
					type="button"
				>
					<span className={styles.keyboardIcon}>⌨️</span>
					Keyboard Shortcuts
					<span className={styles.keyboardHelpIcon}>
						{showKeyboardHelp ? "▼" : "▶"}
					</span>
				</button>
			</div>

			{/* Keyboard Help */}
			{showKeyboardHelp && (
				<div
					id="keyboardHelp"
					className={styles.keyboardHelp}
					role="complementary"
					aria-label="Keyboard shortcuts help"
				>
					<h3>Keyboard Shortcuts</h3>
					<ul>
						<li>
							<kbd>←</kbd> Select left name
						</li>
						<li>
							<kbd>→</kbd> Select right name
						</li>
						<li>
							<kbd>↑</kbd> Vote for both names
						</li>
						<li>
							<kbd>↓</kbd> Skip this match
						</li>
						<li>
							<kbd>Space</kbd> or <kbd>Enter</kbd> Vote for selected name
						</li>
						<li>
							<kbd>Escape</kbd> Clear selection
						</li>
						<li>
							<kbd>Tab</kbd> Navigate between elements
						</li>
						<li>
							<kbd>C</kbd> Toggle cat pictures
						</li>
					</ul>
				</div>
			)}

			{/* Bracket View */}
			{showBracket && (
				<div
					id="bracketView"
					className={styles.bracketView}
					role="complementary"
					aria-label="Tournament bracket history"
				>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					<Bracket matches={transformedMatches as any} />
				</div>
			)}
		</>
	);
});
