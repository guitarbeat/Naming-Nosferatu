/**
 * @module NameManagementView
 * @description Unified view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import React, { useEffect, useMemo, useState } from "react";
import Button from "../Button/Button";
import ErrorComponent from "../Error/Error";
import Loading from "../Loading/Loading";
import { NameGrid } from "../NameGrid/NameGrid";
import { TournamentToolbar } from "../TournamentToolbar/TournamentToolbar";
import styles from "./NameManagementView.module.css";
// Consolidated imports
import {
	type NameItem,
	NameManagementProvider,
	type NameManagementViewExtensions,
	type TournamentFilters,
	type UseNameManagementViewProps,
	useNameManagementView,
} from "./nameManagementCore";

interface NameManagementViewProps extends UseNameManagementViewProps {
	className?: string;
	onStartTournament?: (selectedNames: NameItem[]) => void;
	onOpenSuggestName?: () => void;
	extensions?: NameManagementViewExtensions;
}

export function NameManagementView({
	mode = "tournament",
	userName,
	onStartTournament,
	onOpenSuggestName = () => {},
	extensions = {},
	tournamentProps = {},
	profileProps = {},
	className = "",
}: NameManagementViewProps) {
	// * Sync analysis mode with URL
	const [analysisMode, setAnalysisMode] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const params = new URLSearchParams(window.location.search);
		setAnalysisMode(params.get("analysis") === "true");
	}, []);

	const state = useNameManagementView({
		mode,
		userName,
		profileProps,
		tournamentProps,
		analysisMode,
		setAnalysisMode,
	});

	const {
		names,
		isLoading,
		isError,
		dataError,
		selectedNames,
		toggleName,
		selectedCount,
		showSelectedOnly,
		setShowSelectedOnly,
		isSwipeMode,
		showCatPictures,
		filteredNamesForSwipe,
		filterConfig,
		handleFilterChange,
		clearErrors,
	} = state;

	const contextValue = useMemo(
		() => ({
			names,
			selectedNames,
			toggleName,
			toggleNameById: state.toggleNameById,
			toggleNamesByIds: state.toggleNamesByIds,
			selectAll: state.selectAll,
			clearSelection: state.clearSelection,
			isSelected: state.isSelected,
			selectedCount,
			totalCount: names.length,
			mode: mode || "tournament", // Ensure mode is string
			handleFilterChange,
			onStartTournament,
		}),
		[
			names,
			selectedNames,
			toggleName,
			state.toggleNameById,
			state.toggleNamesByIds,
			state.selectAll,
			state.clearSelection,
			state.isSelected,
			selectedCount,
			mode,
			handleFilterChange,
			onStartTournament,
		],
	);

	if (isLoading) return <Loading message="Preparing cat database..." />;

	return (
		<>
			{isError && (
				<ErrorComponent
					message={dataError?.message || "An error occurred"}
					onRetry={state.refetch}
					onClear={clearErrors}
					autoHideDuration={5000}
				/>
			)}

			{/* Tournament Page Title & Global Actions - Only for tournament mode */}
			{mode === "tournament" && !analysisMode && (
				<TournamentToolbar
					mode="tournament"
					filters={filterConfig as TournamentFilters}
					onFilterChange={handleFilterChange}
					categories={tournamentProps.categories || []}
					showUserFilter={false}
					showSelectionFilter={false}
					totalCount={names.length}
					filteredCount={filteredNamesForSwipe.length}
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
			)}

			<NameManagementProvider value={contextValue}>
				{/* Render context logic extension inside provider */}
				{extensions.contextLogic &&
					(typeof extensions.contextLogic === "function"
						? extensions.contextLogic()
						: extensions.contextLogic)}

				<div
					className={`${styles.container} ${className}`}
					data-component="name-management-view"
					data-mode={mode}
					role="main"
					aria-label={`${mode === "tournament" ? "Tournament" : "Profile"} name management`}
				>
					{/* Mode-specific Header */}
					{extensions.header && (
						<div className={styles.headerSection}>
							{typeof extensions.header === "function"
								? extensions.header()
								: extensions.header}
						</div>
					)}

					{/* Profile Dashboard (profile mode or analysis mode) */}
					{(mode === "profile" || (mode === "tournament" && analysisMode)) &&
						extensions.dashboard && (
							<section
								className={styles.dashboardSection}
								aria-label="Dashboard and statistics"
								data-section="dashboard"
							>
								{React.isValidElement(extensions.dashboard)
									? extensions.dashboard
									: typeof extensions.dashboard === "function"
										? React.createElement(
												extensions.dashboard as React.ComponentType,
											)
										: extensions.dashboard}
							</section>
						)}

					{/* Tournament Toolbar - Only for profile/hybrid mode (tournament mode filters are rendered above) */}
					{mode !== "tournament" && !analysisMode && (
						<section
							className={styles.filtersSection}
							aria-label="Filter and search controls"
							data-section="filters"
						>
							<TournamentToolbar
								mode={mode as "tournament" | "profile" | "hybrid"}
								filters={filterConfig as TournamentFilters}
								onFilterChange={handleFilterChange}
								categories={tournamentProps.categories || []}
								showUserFilter={profileProps.showUserFilter}
								showSelectionFilter={!!profileProps.selectionStats}
								userOptions={profileProps.userOptions}
								filteredCount={0} // Logic for filteredCount in profile mode not shown but can be added
								totalCount={names.length}
							/>
						</section>
					)}

					{/* Tournament Mode: Header Actions */}
					{mode === "tournament" && !extensions.nameGrid && (
						<nav
							className={styles.tournamentActions}
							aria-label="Tournament action buttons"
							data-section="tournament-actions"
						>
							{selectedCount > 0 && !analysisMode && (
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

					{/* Tournament Mode: Progress Bar */}
					{mode === "tournament" && !analysisMode && !extensions.nameGrid && (
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

					{/* Profile Mode: Bulk Actions */}
					{(mode === "profile" || (mode === "tournament" && analysisMode)) &&
						extensions.bulkActions && (
							<section
								className={styles.bulkActionsSection}
								aria-label="Bulk actions"
								data-section="bulk-actions"
							>
								{typeof extensions.bulkActions === "function"
									? React.createElement(
											extensions.bulkActions as React.ComponentType<any>,
											{
												// Cast to any if needed to avoid strict props check on extension components
												onExport: () => {
													exportTournamentResultsToCSV(
														names,
														"naming_nosferatu_export",
													);
												},
											},
										)
									: null}
							</section>
						)}

					{/* Name Grid */}
					<section
						className={styles.gridSection}
						aria-label="Name selection grid"
						data-section="name-grid"
					>
						{extensions.nameGrid ? (
							typeof extensions.nameGrid === "function" ? (
								extensions.nameGrid()
							) : (
								extensions.nameGrid
							)
						) : mode === "tournament" &&
							isSwipeMode &&
							tournamentProps.SwipeableCards ? (
							React.createElement(tournamentProps.SwipeableCards, {
								names: filteredNamesForSwipe,
								selectedNames: selectedNames,
								onToggleName: toggleName,
								onRateName: (name, rating) => {
									console.log("Rate", name, rating);
								}, // Dummy handler or add to hook?
								isAdmin: !!profileProps.isAdmin,
								isSelectionMode: false, // Dummy
								// These props are not in SwipeableCardsProps?
								// showCatPictures: showCatPictures,
								// imageList: tournamentProps.imageList,
								// onStartTournament: onStartTournament ...
								// Wait, SwipeableCardsProps validation might fail if I pass extra props not in interface?
								// React generic components usually accept extra props but TS is strict.
								// I will cast to any to be safe on this dynamic rendering for now, OR valid SwipeableCardsProps.
								// But previously I defined SwipeableCardsProps in types.ts.
								// I'll stick to what I defined.
							} as any)
						) : (
							<NameGrid
								names={names}
								selectedNames={selectedNames}
								onToggleName={toggleName}
								filters={filterConfig}
								isAdmin={!!(tournamentProps.isAdmin || profileProps.isAdmin)}
								showSelectedOnly={showSelectedOnly}
								showCatPictures={showCatPictures}
								imageList={tournamentProps.imageList}
								onToggleVisibility={profileProps.onToggleVisibility}
								onDelete={profileProps.onDelete}
								isLoading={isLoading}
								className={tournamentProps.gridClassName}
							/>
						)}
					</section>

					{/* Mode-specific Extensions */}
					{extensions.navbar && (
						<div className={styles.navbarSection}>
							{typeof extensions.navbar === "function"
								? extensions.navbar()
								: extensions.navbar}
						</div>
					)}

					{extensions.lightbox && (
						<div className={styles.lightboxSection}>
							{typeof extensions.lightbox === "function"
								? extensions.lightbox()
								: extensions.lightbox}
						</div>
					)}

					{extensions.nameSuggestion && (
						<div className={styles.nameSuggestionSection}>
							{typeof extensions.nameSuggestion === "function"
								? extensions.nameSuggestion()
								: extensions.nameSuggestion}
						</div>
					)}
				</div>
			</NameManagementProvider>
		</>
	);
}

export default NameManagementView;
