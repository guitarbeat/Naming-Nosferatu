import React from "react";
import type { NameItem } from "../../../../types/components";
import Button from "../../Button/Button";
import { NameGrid } from "../../NameGrid/NameGrid";
import { TournamentToolbar } from "../../TournamentToolbar/TournamentToolbar";
import styles from "../NameManagementView.module.css";
import type { NameManagementViewExtensions, TournamentFilters } from "../nameManagementCore";

export interface SwipeableCardsProps {
	names: NameItem[];
	selectedNames: NameItem[];
	onToggleName: (name: NameItem) => void;
	onRateName: (name: NameItem, rating: number) => void;
	isAdmin: boolean;
	isSelectionMode: boolean;
	showCatPictures: boolean;
	imageList?: string[];
	onStartTournament?: (selectedNames: NameItem[]) => void;
}

interface TournamentModeProps {
	analysisMode: boolean;
	filterConfig: TournamentFilters;
	handleFilterChange: (name: string, value: string) => void;
	categories?: string[];
	totalCount: number;
	filteredCount: number;
	selectedCount: number;
	onStartTournament?: (selectedNames: NameItem[]) => void;
	onOpenSuggestName: () => void;
	selectedNames: NameItem[];
	showSelectedOnly: boolean;
	setShowSelectedOnly: (show: boolean) => void;
	names: NameItem[];
	extensions: NameManagementViewExtensions;
	isSwipeMode: boolean;
	showCatPictures: boolean;
	filteredNamesForSwipe: NameItem[];
	toggleName: (name: NameItem) => void;
	isLoading: boolean;
	isAdmin?: boolean;
	imageList?: string[];
	// biome-ignore lint/style/useNamingConvention: Component prop, PascalCase is appropriate
	SwipeableCards?: React.ComponentType<SwipeableCardsProps>;
}

export function TournamentMode({
	analysisMode,
	filterConfig,
	handleFilterChange,
	categories,
	totalCount,
	filteredCount,
	selectedCount,
	onStartTournament,
	onOpenSuggestName,
	selectedNames,
	showSelectedOnly,
	setShowSelectedOnly,
	names,
	extensions,
	isSwipeMode,
	showCatPictures,
	filteredNamesForSwipe,
	toggleName,
	isLoading,
	isAdmin,
	imageList,
	SwipeableCards,
}: TournamentModeProps) {
	if (analysisMode) {
		return null;
	}

	return (
		<>
			{/* Tournament Page Title & Global Actions */}
			<TournamentToolbar
				mode="tournament"
				filters={filterConfig}
				onFilterChange={handleFilterChange}
				categories={categories || []}
				showUserFilter={false}
				showSelectionFilter={false}
				totalCount={totalCount}
				filteredCount={filteredCount}
				startTournamentButton={
					selectedCount >= 2 && onStartTournament
						? {
								onClick: () => onStartTournament(selectedNames),
								selectedCount,
							}
						: undefined
				}
				onOpenSuggestName={onOpenSuggestName}
			/>

			<div className={styles.container} data-mode="tournament">
				{/* Header Extension */}
				{extensions.header && (
					<div className={styles.headerSection}>
						{typeof extensions.header === "function" ? extensions.header() : extensions.header}
					</div>
				)}

				{/* Header Actions (Show Selected Toggle) */}
				{!extensions.nameGrid && (
					<nav className={styles.tournamentActions}>
						{selectedCount > 0 && (
							<Button
								variant={showSelectedOnly ? "primary" : "secondary"}
								size="small"
								onClick={() => setShowSelectedOnly(!showSelectedOnly)}
								className={styles.actionButton}
							>
								{showSelectedOnly ? "👁️ Show All Names" : "👀 Show Selected Only"}
							</Button>
						)}
					</nav>
				)}

				{/* Progress Bar */}
				{!extensions.nameGrid && (
					<div
						className={styles.progressSection}
						role="progressbar"
						aria-valuenow={selectedCount}
						aria-valuemin={0}
						aria-valuemax={names.length}
						aria-label="Selection Progress"
					>
						<div className={styles.progressBar}>
							<div
								className={styles.progressFill}
								style={{
									width: `${Math.max((selectedCount / Math.max(names.length, 1)) * 100, 5)}%`,
								}}
							/>
						</div>
						<span className={styles.progressText}>
							{selectedCount} of {names.length} names selected
							{selectedCount < 2 && (
								<span className={styles.progressHint} role="status" aria-live="polite">
									{" "}
									(Need {2 - selectedCount} more to start tournament)
								</span>
							)}
						</span>
					</div>
				)}

				{/* Name Grid */}
				<section className={styles.gridSection}>
					{extensions.nameGrid ? (
						extensions.nameGrid
					) : isSwipeMode && SwipeableCards && !isLoading ? (
						React.createElement(SwipeableCards, {
							names: filteredNamesForSwipe,
							selectedNames: selectedNames,
							onToggleName: toggleName,
							onRateName: (name: NameItem, rating: number) => {
								console.log("Rate", name, rating);
							},
							isAdmin: !!isAdmin,
							isSelectionMode: false,
							showCatPictures: showCatPictures,
							imageList: imageList,
							onStartTournament: onStartTournament,
						})
					) : (
						<NameGrid
							names={names}
							selectedNames={selectedNames}
							onToggleName={toggleName}
							filters={filterConfig}
							isAdmin={isAdmin}
							showSelectedOnly={showSelectedOnly}
							showCatPictures={showCatPictures}
							imageList={imageList}
							isLoading={isLoading}
						/>
					)}
				</section>
			</div>
		</>
	);
}
