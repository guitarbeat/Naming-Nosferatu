import React from "react";
import Button from "../../Button/Button";
import { NameGrid } from "../../NameGrid/NameGrid";
import { TournamentToolbar } from "../../TournamentToolbar/TournamentToolbar";
import { NameManagementViewExtensions, TournamentFilters, useNameManagementContext } from "../nameManagementCore";
import styles from "../NameManagementView.module.css";

interface TournamentModeProps {
	analysisMode: boolean;
	filterConfig: TournamentFilters;
	handleFilterChange: (name: string, value: string) => void;
	categories?: string[];
	totalCount: number;
	filteredCount: number;
	selectedCount: number;
	onStartTournament?: (selectedNames: any[]) => void;
	onOpenSuggestName: () => void;
	selectedNames: any[];
	showSelectedOnly: boolean;
	setShowSelectedOnly: (show: boolean) => void;
	names: any[];
	extensions: NameManagementViewExtensions;
	isSwipeMode: boolean;
	showCatPictures: boolean;
	filteredNamesForSwipe: any[];
	toggleName: (name: any) => void;
	isLoading: boolean;
	isAdmin?: boolean;
	imageList?: string[];
	SwipeableCards?: React.ComponentType<any>;
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
	if (analysisMode) return null;

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
						{typeof extensions.header === "function"
							? extensions.header()
							: extensions.header}
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
								{showSelectedOnly ? "👁️ Show All" : "👀 Show Selected"}
							</Button>
						)}
					</nav>
				)}

				{/* Progress Bar */}
				{!extensions.nameGrid && (
					<div className={styles.progressSection}>
						<div className={styles.progressBar}>
							<div
								className={styles.progressFill}
								style={{
									width: `${Math.max(
										(selectedCount / Math.max(names.length, 1)) * 100,
										5,
									)}%`,
								}}
							/>
						</div>
						<span className={styles.progressText}>
							{selectedCount} of {names.length} names selected
						</span>
					</div>
				)}

				{/* Name Grid */}
				<section className={styles.gridSection}>
					{extensions.nameGrid ? (
						typeof extensions.nameGrid === "function" ? (
							extensions.nameGrid()
						) : (
							extensions.nameGrid
						)
					) : isSwipeMode && SwipeableCards ? (
						React.createElement(SwipeableCards, {
							names: filteredNamesForSwipe,
							selectedNames: selectedNames,
							onToggleName: toggleName,
							onRateName: (name: any, rating: number) => {
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
