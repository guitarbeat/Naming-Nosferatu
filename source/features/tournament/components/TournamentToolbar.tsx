/**
 * @module TournamentToolbar
 * @description Consolidated tournament toolbar component
 * Handles high-level layout, glass effects, and filtering/sorting logic
 */

import { cn } from "@utils";
import { Eye, EyeOff, GalleryHorizontal, LayoutGrid, Plus, Search } from "lucide-react";
import React, { useId } from "react";
import Button from "@/layout/Button";
import { Input } from "@/layout/FormPrimitives";
import useAppStore from "@/store";
import type { TournamentFilters } from "@/types";
import { FilterModeToolbar } from "./FilterModeToolbar";
import { type SelectOption, styles, ToolbarGlass } from "./TournamentToolbarComponents";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TournamentToolbarProps {
	mode?: "tournament" | "profile" | "hybrid";
	filters?: TournamentFilters;
	onFilterChange?: (name: string, value: string) => void;
	showUserFilter?: boolean;
	showSelectionFilter?: boolean;
	userOptions?: SelectOption[] | null;
	startTournamentButton?: {
		onClick: () => void;
		selectedCount: number;
	};
	analysisMode?: boolean;
	className?: string;
}

function TournamentToolbar({
	mode = "tournament",
	filters = {},
	onFilterChange,
	showUserFilter = false,
	showSelectionFilter = false,
	userOptions = null,
	startTournamentButton,
	analysisMode = false,
	className = "",
}: TournamentToolbarProps) {
	const isTournament = mode === "tournament";
	const isHybrid = mode === "hybrid";
	// * Progressive Disclosure: In tournament mode, filters are hidden by default
	const [showFiltersInTournament, setShowFiltersInTournament] = React.useState(false);

	const showFilters = isHybrid || mode === "profile" || (isTournament && showFiltersInTournament);

	const toolbarGlassId = useId();
	const glassId = `toolbar-glass-${toolbarGlassId.replace(/:/g, "-")}`;

	// Get swipe mode and cat pictures state from store
	const { isSwipeMode, showCatPictures } = useAppStore((state) => state.ui);
	const { setSwipeMode, setCatPictures } = useAppStore((state) => state.uiActions);

	// Tournament mode toolbar content
	const renderTournamentMode = () => {
		const selectedCount = startTournamentButton?.selectedCount ?? 0;
		const isReady = selectedCount >= 2;

		const buttonLabel = isReady ? `Begin Tournament (${selectedCount})` : "Pick 2+ names to start";

		const tooltipText = isReady
			? `Start comparing ${selectedCount} names`
			: "Select at least 2 names to start a tournament.";

		return (
			<nav className={styles.unifiedContainer} data-mode={mode}>
				<div className="tournament-toolbar-search-wrapper">
					<Search className="tournament-toolbar-search-icon" size={16} />
					<Input
						placeholder="Search names..."
						value={filters.searchTerm || ""}
						onChange={(e) => onFilterChange?.("searchTerm", e.target.value)}
						className={styles.searchInput}
					/>
				</div>

				<button
					type="button"
					onClick={() => setSwipeMode(false)}
					className={cn(styles.toolbarToggle, !isSwipeMode && styles.toolbarToggleActive)}
					title="Switch to Grid View"
				>
					<LayoutGrid size={16} />
					<span>Grid</span>
				</button>
				<button
					type="button"
					onClick={() => setSwipeMode(true)}
					className={cn(styles.toolbarToggle, isSwipeMode && styles.toolbarToggleActive)}
					title="Switch to Swipe View"
				>
					<GalleryHorizontal size={16} />
					<span>Swipe</span>
				</button>

				<span className={styles.toolbarDivider} aria-hidden="true" />

				<button
					type="button"
					onClick={() => setCatPictures(!showCatPictures)}
					className={cn(
						styles.toolbarToggle,
						styles.toolbarToggleAccent,
						showCatPictures && styles.toolbarToggleActive,
					)}
					title={showCatPictures ? "Show Names Only" : "Show Cat Photos"}
				>
					{showCatPictures ? <Eye size={16} /> : <EyeOff size={16} />}
					<span>{showCatPictures ? "Names Only" : "Show Cats"}</span>
				</button>

				{/* Progressive Disclosure: Filter Toggle */}
				<button
					type="button"
					onClick={() => setShowFiltersInTournament(!showFiltersInTournament)}
					className={cn(
						styles.toolbarToggle,
						showFiltersInTournament && styles.toolbarToggleActive,
					)}
					title="Toggle search and filters"
				>
					<span>{showFiltersInTournament ? "Hide Filters" : "Filters"}</span>
				</button>

				{startTournamentButton && (
					<div className={styles.startButtonWrapper} title={tooltipText}>
						<Button
							onClick={startTournamentButton.onClick}
							disabled={!isReady}
							className={styles.startButton}
							aria-label={buttonLabel}
							startIcon={isReady ? <Plus className="w-4 h-4" /> : null}
						>
							{buttonLabel}
						</Button>
						{!isReady && selectedCount > 0 && (
							<span className={styles.startButtonHint} role="status" aria-live="polite">
								{selectedCount === 1
									? "Select 1 more name"
									: `Select ${2 - selectedCount} more names`}
							</span>
						)}
					</div>
				)}
			</nav>
		);
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "16px",
				width: "100%",
			}}
		>
			<ToolbarGlass
				mode={isTournament ? "tournament" : "filter"}
				id={glassId}
				className={className}
			>
				{isTournament ? (
					renderTournamentMode()
				) : (
					<FilterModeToolbar
						filters={filters}
						onFilterChange={onFilterChange}
						showUserFilter={showUserFilter}
						userOptions={userOptions}
						showSelectionFilter={showSelectionFilter}
						analysisMode={analysisMode}
						isHybrid={isHybrid}
						showFilters={showFilters}
					/>
				)}
			</ToolbarGlass>

			{/* Render Filter Toolbar below main toolbar when toggled in Tournament Mode */}
			{isTournament && showFiltersInTournament && (
				<ToolbarGlass mode="filter" id={`${glassId}-filters`} className={className}>
					<FilterModeToolbar
						filters={filters}
						onFilterChange={onFilterChange}
						showUserFilter={false}
						showSelectionFilter={false}
						analysisMode={false} // Force simple mode
						isHybrid={true} // Use hybrid layout for compact view
						showFilters={true}
					/>
				</ToolbarGlass>
			)}
		</div>
	);
}

TournamentToolbar.displayName = "TournamentToolbar";

const MemoizedTournamentToolbar = React.memo(TournamentToolbar);
MemoizedTournamentToolbar.displayName = "TournamentToolbar";

export { MemoizedTournamentToolbar as TournamentToolbar };
