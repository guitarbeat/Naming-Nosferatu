/**
 * @module TournamentToolbar
 * @description Consolidated tournament toolbar component
 * Handles high-level layout, glass effects, and filtering/sorting logic
 */

import { cn } from "@utils/cn";
import React, { useId } from "react";
import { FILTER_OPTIONS } from "../../../constants";
import useAppStore from "../../../store/useAppStore";
import Button from "../Button";
import { Select } from "../FormPrimitives";
import LiquidGlass from "../LiquidGlass";
import "./TournamentToolbar.css";

// ============================================================================
// CONFIGURATION
// ============================================================================

import { Eye, EyeOff, GalleryHorizontal, LayoutGrid, Plus } from "lucide-react";

const TOOLBAR_GLASS_CONFIGS = {
	tournament: {
		width: 650,
		height: 80,
		radius: 20,
		scale: -180,
		saturation: 1.2,
		frost: 0.08,
		inputBlur: 12,
		outputBlur: 0.8,
	},
	filter: {
		width: 1200,
		height: 300,
		radius: 24,
		scale: -180,
		saturation: 1.2,
		frost: 0.08,
		inputBlur: 12,
		outputBlur: 0.8,
	},
};

const styles = {
	unifiedContainer: "tournament-toolbar-unified-container",
	toggleStack: "tournament-toolbar-toggle-stack",
	filtersContainer: "tournament-toolbar-filters-container",
	startButton: "tournament-toolbar-start-button",
	startButtonWrapper: "tournament-toolbar-start-button-wrapper",
	startButtonHint: "tournament-toolbar-start-button-hint",
	toggleWrapper: "tournament-toolbar-toggle-wrapper",
	toggleSwitch: "tournament-toolbar-toggle-switch",
	toggleSwitchActive: "tournament-toolbar-toggle-switch-active",
	toggleThumb: "tournament-toolbar-toggle-thumb",
	toggleLabel: "tournament-toolbar-toggle-label",
	resultsCount: "tournament-toolbar-results-count",
	count: "tournament-toolbar-count",
	separator: "tournament-toolbar-separator",
	total: "tournament-toolbar-total",
	badge: "tournament-toolbar-badge",
	badgeTotal: "tournament-toolbar-badge-total",
	filtersGrid: "tournament-toolbar-filters-grid",
	filterRow: "tournament-toolbar-filter-row",
	filterGroup: "tournament-toolbar-filter-group",
	sortGroup: "tournament-toolbar-sort-group",
	filterLabel: "tournament-toolbar-filter-label",
	filterSelect: "tournament-toolbar-filter-select",
	sortControls: "tournament-toolbar-sort-controls",
	sortOrderButton: "tournament-toolbar-sort-order-button",
	sortIcon: "tournament-toolbar-sort-icon",
	suggestButton: "tournament-toolbar-suggest-button",
};

const FILTER_CONFIGS = {
	visibility: [
		{ value: "all", label: "All Names" },
		{ value: "visible", label: "Visible Only" },
		{ value: "hidden", label: "Hidden Only" },
	],
	users: [
		{ value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
		{ value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
		{ value: FILTER_OPTIONS.USER.OTHER, label: "Other Users" },
	],
	sort: [
		{ value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
		{ value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
		{ value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
		{ value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
		{ value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
		{ value: FILTER_OPTIONS.SORT.CREATED, label: "Created" },
	],
	selection: [
		{ value: "all", label: "All Names" },
		{ value: "selected", label: "Ever Selected" },
		{ value: "never_selected", label: "Never Selected" },
		{ value: "frequently_selected", label: "Frequently Selected" },
		{ value: "recently_selected", label: "Recently Selected" },
	],
	date: [
		{ value: "all", label: "All Dates" },
		{ value: "today", label: "Today" },
		{ value: "week", label: "This Week" },
		{ value: "month", label: "This Month" },
		{ value: "year", label: "This Year" },
	],
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface SortOrderIconProps {
	direction?: "asc" | "desc";
	className?: string;
}

function SortOrderIcon({ direction = "asc", className = "" }: SortOrderIconProps) {
	return (
		<svg
			className={className}
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			{direction === "asc" ? (
				<path
					d="M8 4L4 8H7V12H9V8H12L8 4Z"
					fill="currentColor"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			) : (
				<path
					d="M8 12L12 8H9V4H7V8H4L8 12Z"
					fill="currentColor"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			)}
		</svg>
	);
}

interface SelectOption {
	value: string;
	label: string;
}

interface FilterSelectProps {
	id: string;
	label: string;
	value: string | null;
	options: SelectOption[];
	onChange: (value: string | null) => void;
}

function FilterSelect({ id, label, value, options, onChange }: FilterSelectProps) {
	return (
		<div className={styles.filterGroup}>
			<label htmlFor={id} className={styles.filterLabel}>
				{label}
			</label>
			<Select
				name={id}
				value={value || ""}
				onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null)}
				options={options}
				className={styles.filterSelect}
			/>
		</div>
	);
}

interface ToolbarGlassProps {
	mode: "tournament" | "filter";
	id: string;
	className?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}

function ToolbarGlass({ mode, id, className, style, children }: ToolbarGlassProps) {
	const config =
		TOOLBAR_GLASS_CONFIGS[mode as keyof typeof TOOLBAR_GLASS_CONFIGS] ||
		TOOLBAR_GLASS_CONFIGS.filter;

	return (
		<LiquidGlass
			id={id}
			width={config.width}
			height={config.height}
			radius={config.radius}
			scale={config.scale}
			saturation={config.saturation}
			frost={config.frost}
			inputBlur={config.inputBlur}
			outputBlur={config.outputBlur}
			className={className}
			style={{ width: "100%", height: "auto", ...style }}
		>
			{children}
		</LiquidGlass>
	);
}

// ============================================================================
// FILTER TOOLBAR
// ============================================================================

interface TournamentFilters {
	searchTerm?: string;
	sortBy?: string;
	filterStatus?: string;
	userFilter?: string;
	selectionFilter?: string;
	sortOrder?: string;
	dateFilter?: string;
}

interface FilterModeToolbarProps {
	filters: TournamentFilters;
	onFilterChange?: (name: string, value: string) => void;
	filteredCount: number;
	totalCount: number;
	// categories removed
	showUserFilter: boolean;
	userOptions?: { value: string; label: string }[] | null;
	showSelectionFilter: boolean;
	analysisMode: boolean;
	isHybrid: boolean;
	showFilters: boolean;
}

function FilterModeToolbar({
	filters,
	onFilterChange,
	filteredCount,
	totalCount,
	// categories removed
	showUserFilter,
	userOptions = null,
	showSelectionFilter,
	analysisMode,
	// isHybrid removed
	showFilters,
}: FilterModeToolbarProps) {
	// categoryOptions removed

	const isAsc = filters.sortOrder === FILTER_OPTIONS.ORDER.ASC;

	return (
		<div className={styles.filtersContainer}>
			<div className={styles.resultsCount}>
				<span className={styles.count}>{filteredCount.toLocaleString()}</span>
				{filteredCount !== totalCount && (
					<>
						<span className={styles.separator}>/</span>
						<span className={styles.total}>{totalCount.toLocaleString()}</span>
						<span className={styles.badge}>filtered</span>
					</>
				)}
				{filteredCount === totalCount && (
					<span className={`${styles.badge} ${styles.badgeTotal}`}>total</span>
				)}
			</div>

			{showFilters && (
				<div className={styles.filtersGrid}>
					<div className={styles.filterRow}>
						<FilterSelect
							id="filter-status"
							label="Status"
							value={(filters.filterStatus as string) || FILTER_OPTIONS.VISIBILITY.VISIBLE}
							options={FILTER_CONFIGS.visibility}
							onChange={(value) =>
								onFilterChange?.(
									"filterStatus",
									(value === "active"
										? FILTER_OPTIONS.VISIBILITY.VISIBLE
										: value || FILTER_OPTIONS.VISIBILITY.VISIBLE) as string,
								)
							}
						/>
						{showUserFilter && (
							<FilterSelect
								id="filter-user"
								label="User"
								value={(filters.userFilter as string) || FILTER_OPTIONS.USER.ALL}
								options={userOptions || FILTER_CONFIGS.users}
								onChange={(value) => onFilterChange?.("userFilter", value as string)}
							/>
						)}
						{showSelectionFilter && (
							<FilterSelect
								id="filter-selection"
								label="Selection"
								value={(filters.selectionFilter as string) || "all"}
								options={FILTER_CONFIGS.selection}
								onChange={(value) => onFilterChange?.("selectionFilter", value as string)}
							/>
						)}
						{analysisMode && (
							<FilterSelect
								id="filter-date"
								label="Date"
								value={(filters.dateFilter as string) || "all"}
								options={FILTER_CONFIGS.date}
								onChange={(value) => onFilterChange?.("dateFilter", value as string)}
							/>
						)}
					</div>
					<div className={styles.filterRow}>
						<div className={styles.sortGroup}>
							<label htmlFor="filter-sort" className={styles.filterLabel}>
								Sort By
							</label>
							<div className={styles.sortControls}>
								<Select
									name="filter-sort"
									value={
										(filters.sortBy as string | number | null | undefined) ||
										FILTER_OPTIONS.SORT.RATING
									}
									onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
										onFilterChange?.("sortBy", e.target.value)
									}
									options={FILTER_CONFIGS.sort}
									className={styles.filterSelect}
								/>
								<button
									type="button"
									onClick={() =>
										onFilterChange?.(
											"sortOrder",
											(isAsc ? FILTER_OPTIONS.ORDER.DESC : FILTER_OPTIONS.ORDER.ASC) as string,
										)
									}
									className={styles.sortOrderButton}
									title={`Sort ${isAsc ? "Descending" : "Ascending"}`}
									aria-label={`Toggle sort order to ${isAsc ? "descending" : "ascending"}`}
								>
									<SortOrderIcon direction={isAsc ? "asc" : "desc"} className={styles.sortIcon} />
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TournamentToolbarProps {
	mode?: "tournament" | "profile" | "hybrid";
	filters?: TournamentFilters;
	onFilterChange?: (name: string, value: string) => void;
	filteredCount?: number;
	totalCount?: number;
	// categories removed
	showUserFilter?: boolean;
	showSelectionFilter?: boolean;
	userOptions?: { value: string; label: string }[] | null;
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
	filteredCount = 0,
	totalCount = 0,
	// categories removed
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
			<div className={styles.unifiedContainer} data-mode={mode}>
				<div className="flex items-center gap-2">
					<div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/10">
						<button
							type="button"
							onClick={() => setSwipeMode(false)}
							className={cn(
								"flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
								isSwipeMode
									? "text-white/40 hover:text-white/60 hover:bg-white/5"
									: "bg-white/10 text-white shadow-sm",
							)}
							title="Switch to Grid View"
						>
							<LayoutGrid size={16} />
							<span>Grid</span>
						</button>
						<button
							type="button"
							onClick={() => setSwipeMode(true)}
							className={cn(
								"flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
								isSwipeMode
									? "bg-purple-500/20 text-purple-200 shadow-sm ring-1 ring-purple-500/30"
									: "text-white/40 hover:text-white/60 hover:bg-white/5",
							)}
							title="Switch to Swipe View"
						>
							<GalleryHorizontal size={16} />
							<span>Swipe</span>
						</button>
					</div>

					<div className="h-6 w-px bg-white/10 mx-2" />

					<button
						type="button"
						onClick={() => setCatPictures(!showCatPictures)}
						className={cn(
							"flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
							showCatPictures
								? "bg-pink-500/10 border-pink-500/20 text-pink-200 hover:bg-pink-500/20"
								: "bg-white/5 border-transparent text-white/40 hover:text-white/60 hover:bg-white/10",
						)}
						title={showCatPictures ? "Show Names Only" : "Show Cat Photos"}
					>
						{showCatPictures ? <Eye size={16} /> : <EyeOff size={16} />}
						<span>{showCatPictures ? "Show Cats" : "Names Only"}</span>
					</button>

					{/* Progressive Disclosure: Filter Toggle */}
					<button
						type="button"
						onClick={() => setShowFiltersInTournament(!showFiltersInTournament)}
						className={cn(
							"flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ml-auto",
							showFiltersInTournament
								? "bg-white/10 border-white/10 text-white"
								: "bg-transparent border-transparent text-white/40 hover:text-white/60 hover:bg-white/5",
						)}
						title="Toggle search and filters"
					>
						<span className={styles.toggleLabel}>
							{showFiltersInTournament ? "Hide Filters" : "Filters"}
						</span>
					</button>
				</div>

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
			</div>
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
						filteredCount={filteredCount}
						totalCount={totalCount}
						// categories removed
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
						filteredCount={filteredCount}
						totalCount={totalCount}
						// categories removed
						// * Field Reduction: Hide complex filters in tournament mode
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
