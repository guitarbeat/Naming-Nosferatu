/**
 * @module Tournament/components/TournamentHeader
 * @description Header for tournament view showing setup controls or progress.
 * @author Aaron Lor
 */

import Card from "../../../../shared/components/Card/Card";
import styles from "../../Tournament.module.css";
import setupStyles from "../../TournamentSetup.module.css";
import { StartButton } from "../StartButton";

interface NameItem {
	id?: string | number;
	name?: string;
	[key: string]: unknown;
}

interface TournamentHeaderProps {
	roundNumber?: number;
	currentMatchNumber?: number;
	totalMatches?: number;
	progress?: number;
	selectedNames?: NameItem[];
	availableNames?: NameItem[];
	onSelectAll?: () => void;
	isSwipeMode?: boolean;
	onSwipeModeToggle?: () => void;
	showCatPictures?: boolean;
	onCatPicturesToggle?: () => void;
	onStart?: (names: NameItem[]) => void;
	isAdmin?: boolean;
}

function TournamentHeader({
	roundNumber,
	currentMatchNumber,
	totalMatches,
	progress,
	selectedNames,
	availableNames,
	onSelectAll,
	isSwipeMode,
	onSwipeModeToggle,
	showCatPictures,
	onCatPicturesToggle,
	onStart,
	isAdmin,
}: TournamentHeaderProps) {
	const isSetupMode = selectedNames !== undefined;

	if (isSetupMode) {
		return (
			<div className={setupStyles.panelHeader}>
				<div className={setupStyles.headerRow}>
					<div className={setupStyles.headerActions}>
						{isAdmin && (
							<button
								className={setupStyles.selectAllButton}
								onClick={onSelectAll}
								type="button"
								aria-label={
									availableNames &&
									selectedNames.length === availableNames.length
										? "Clear all selections"
										: "Select all names"
								}
							>
								{availableNames &&
								selectedNames.length === availableNames.length
									? "✨ Start Fresh"
									: "🎲 Select All"}
							</button>
						)}

						{onSwipeModeToggle && (
							<button
								onClick={onSwipeModeToggle}
								className={`${setupStyles.headerActionButton} ${setupStyles.swipeModeToggleButton} ${
									isSwipeMode ? setupStyles.headerActionButtonActive : ""
								}`}
								type="button"
								aria-label={
									isSwipeMode ? "Switch to card mode" : "Switch to swipe mode"
								}
							>
								{isSwipeMode ? "🎯 Cards" : "💫 Swipe"}
							</button>
						)}

						{onCatPicturesToggle && (
							<button
								onClick={onCatPicturesToggle}
								className={`${setupStyles.headerActionButton} ${setupStyles.catPicturesToggleButton} ${
									showCatPictures ? setupStyles.headerActionButtonActive : ""
								}`}
								type="button"
								aria-label={
									showCatPictures
										? "Hide cat pictures"
										: "Show cat pictures on cards"
								}
								title="Add random cat pictures to make it more like Tinder! 🐱"
							>
								{showCatPictures ? "🐱 Hide Cats" : "🐱 Show Cats"}
							</button>
						)}

						{selectedNames && selectedNames.length >= 2 && onStart && (
							<StartButton
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								selectedNames={selectedNames as any}
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								onStart={onStart as any}
								variant="header"
							/>
						)}
					</div>
				</div>
			</div>
		);
	}

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
}

export default TournamentHeader;
