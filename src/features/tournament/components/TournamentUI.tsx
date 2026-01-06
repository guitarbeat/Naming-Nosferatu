/**
 * @module TournamentUI
 * @description Consolidated UI components for the Tournament feature.
 * Includes Header, Footer, MatchResult, and RoundTransition.
 */

import { memo } from "react";
import Bracket from "../../../shared/components/Bracket/Bracket";
import Card from "../../../shared/components/Card/Card";
import styles from "../styles/TournamentControls.module.css";
import progressStyles from "../styles/TournamentProgress.module.css";

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
			className={progressStyles.progressInfo}
			background="glass"
			padding="none"
			shadow="medium"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		>
			<div className={progressStyles.roundInfo}>
				<span className={progressStyles.roundNumber}>Round {roundNumber}</span>
				<span className={progressStyles.matchCount}>
					Match {currentMatchNumber} of {totalMatches}
				</span>
			</div>
			<div
				className={progressStyles.percentageInfo}
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
		<div
			className={progressStyles.matchResult}
			role="status"
			aria-live="polite"
		>
			<div className={progressStyles.resultContent}>
				<span className={progressStyles.resultMessage}>{lastMatchResult}</span>
				<span className={progressStyles.tournamentProgress}>
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
		<div
			className={progressStyles.roundTransition}
			role="status"
			aria-live="polite"
		>
			<div className={progressStyles.transitionContent}>
				<div className={progressStyles.roundIcon}>🏆</div>
				<h2 className={progressStyles.roundTitle}>Round {nextRoundNumber}</h2>
				<p className={progressStyles.roundSubtitle}>Tournament continues...</p>
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
					<Bracket
						// biome-ignore lint/suspicious/noExplicitAny: Bracket component expects specific match type that transformedMatches doesn't match exactly
						matches={transformedMatches as any}
					/>
				</div>
			)}
		</>
	);
});
