/**
 * @module TournamentToolbar
 * @description Consolidated tournament toolbar component
 * Handles high-level layout, glass effects, and filtering/sorting logic
 */

import { motion } from "framer-motion";
import { Cat, Grid3X3, Layers, Plus, Search, X } from "lucide-react";
import React, { useId, useMemo } from "react";
import { FILTER_OPTIONS } from "@/constants";
import useAppStore from "@/store/useAppStore";
import { cn } from "@/utils";
import Button from "./Button";
import { Select } from "./FormPrimitives";
import LiquidGlass from "./LiquidGlass";

// ============================================================================
// CONFIGURATION
// ============================================================================

const TOOLBAR_GLASS_CONFIGS = {
	tournament: {
		width: 900,
		height: 110, // Increased height for better padding
		radius: 24,
		scale: -120, // Adjusted scale for softer distortion
		saturation: 1.1,
		frost: 0.1,
		inputBlur: 10,
		outputBlur: 1.0,
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
		<div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
			<label htmlFor={id} className="text-xs font-semibold text-white/50 tracking-wide ml-1">
				{label}
			</label>
			<Select
				name={id}
				value={value || ""}
				onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value || null)}
				options={options}
				className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:bg-white/10 transition-colors py-2 px-3"
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
	category?: string;
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
	categories: string[];
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
	categories,
	showUserFilter,
	userOptions = null,
	showSelectionFilter,
	analysisMode,
	isHybrid,
	showFilters,
}: FilterModeToolbarProps) {
	const categoryOptions = useMemo(
		() =>
			categories.map((cat) => ({
				value: cat,
				label: cat,
			})),
		[categories],
	);

	const isAsc = filters.sortOrder === FILTER_OPTIONS.ORDER.ASC;

	return (
		<div className="flex flex-col gap-3 p-4 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md shadow-xl">
			<div className="flex items-baseline gap-1.5 text-xs font-medium text-white/50 bg-white/5 px-3 py-1.5 rounded-lg w-fit">
				<span className="text-base font-bold text-white tabular-nums">
					{filteredCount.toLocaleString()}
				</span>
				{filteredCount !== totalCount && (
					<>
						<span className="opacity-50">/</span>
						<span className="text-white/70">{totalCount.toLocaleString()}</span>
						<span className="opacity-70">filtered</span>
					</>
				)}
				{filteredCount === totalCount && <span className="opacity-70">total</span>}
			</div>

			{isHybrid && categories.length > 0 && (
				<div className="flex flex-wrap gap-2">
					<FilterSelect
						id="filter-category"
						label="Category"
						value={filters.category || null}
						options={categoryOptions}
						onChange={(value) => onFilterChange?.("category", value as string)}
					/>
				</div>
			)}

			{showFilters && (
				<div className="flex flex-col gap-3">
					<div className="flex flex-wrap gap-2">
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
					<div className="flex flex-wrap gap-2">
						<div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
							<label
								htmlFor="filter-sort"
								className="text-xs font-semibold text-white/50 tracking-wide ml-1"
							>
								Sort By
							</label>
							<div className="flex items-stretch gap-1">
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
									className="flex-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 hover:bg-white/10 transition-colors py-2 px-3"
								/>
								<button
									type="button"
									onClick={() =>
										onFilterChange?.(
											"sortOrder",
											(isAsc ? FILTER_OPTIONS.ORDER.DESC : FILTER_OPTIONS.ORDER.ASC) as string,
										)
									}
									className="flex items-center justify-center w-10 font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-purple-500/50 transition-all"
									aria-label={`Toggle sort order to ${isAsc ? "descending" : "ascending"}`}
								>
									<SortOrderIcon
										direction={isAsc ? "asc" : "desc"}
										className="w-4 h-4 opacity-70"
									/>
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
	categories?: string[];
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
	categories = [],
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
	const { selectedNames } = useAppStore((state) => state.tournament);
	const selectedCount = selectedNames?.length || 0;

	// Segmented Control Component - Modern iOS-style toggle
	const SegmentedControl = ({
		options,
		value,
		onChange,
	}: {
		options: { value: string; label: string; icon: React.ReactNode }[];
		value: string;
		onChange: (value: string) => void;
	}) => {
		const activeIndex = options.findIndex((opt) => opt.value === value);

		return (
			<div className="relative flex p-1 bg-white/5 rounded-xl border border-white/10">
				{/* Sliding background */}
				<motion.div
					className="absolute top-1 bottom-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg border border-white/20"
					initial={false}
					animate={{
						left: `calc(${activeIndex * (100 / options.length)}% + 4px)`,
						width: `calc(${100 / options.length}% - 8px)`,
					}}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
				/>
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => onChange(opt.value)}
						className={cn(
							"relative z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200",
							value === opt.value ? "text-white" : "text-white/40 hover:text-white/70",
						)}
					>
						{opt.icon}
						<span className="hidden sm:inline">{opt.label}</span>
					</button>
				))}
			</div>
		);
	};

	// Icon Toggle Button - Minimal square icon button
	const IconToggle = ({
		active,
		onClick,
		icon,
		activeIcon,
		label,
	}: {
		active: boolean;
		onClick: () => void;
		icon: React.ReactNode;
		activeIcon?: React.ReactNode;
		label: string;
	}) => (
		<motion.button
			type="button"
			onClick={onClick}
			className={cn(
				"relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200",
				active
					? "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-white border border-white/20 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
					: "bg-white/5 text-white/40 border border-transparent hover:bg-white/10 hover:text-white/70",
			)}
			whileTap={{ scale: 0.92 }}
			aria-label={label}
		>
			{active && activeIcon ? activeIcon : icon}
		</motion.button>
	);

	// Tournament mode toolbar content
	const renderTournamentMode = () => {
		return (
			<div
				className="flex flex-col gap-3 p-3 w-full items-center justify-center max-w-2xl mx-auto"
				data-mode={mode}
			>
				{/* Modern Toolbar Row */}
				<div className="flex items-center gap-3 px-3 py-2 bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
					{/* View Mode Segmented Control */}
					<SegmentedControl
						options={[
							{ value: "grid", label: "Grid", icon: <Grid3X3 className="w-4 h-4" /> },
							{ value: "swipe", label: "Cards", icon: <Layers className="w-4 h-4" /> },
						]}
						value={isSwipeMode ? "swipe" : "grid"}
						onChange={(v) => setSwipeMode(v === "swipe")}
					/>

					{/* Divider */}
					<div className="w-px h-6 bg-white/10" />

					{/* Cat Pictures Toggle */}
					<IconToggle
						active={showCatPictures}
						onClick={() => setCatPictures(!showCatPictures)}
						icon={<Cat className="w-4 h-4" />}
						label={showCatPictures ? "Hide cat pictures" : "Show cat pictures"}
					/>

					{/* Filter Toggle */}
					<IconToggle
						active={showFiltersInTournament}
						onClick={() => setShowFiltersInTournament(!showFiltersInTournament)}
						icon={<Search className="w-4 h-4" />}
						activeIcon={<X className="w-4 h-4" />}
						label={showFiltersInTournament ? "Hide filters" : "Show filters"}
					/>
				</div>

				{/* Selection Status */}
				<div className="min-h-[20px] flex items-center justify-center">
					{selectedCount > 0 && selectedCount < 2 && (
						<motion.div
							className="text-xs font-medium text-white/40"
							initial={{ opacity: 0, y: -5 }}
							animate={{ opacity: 1, y: 0 }}
						>
							Select at least 2 names to start
						</motion.div>
					)}
					{selectedCount >= 2 && (
						<motion.div
							className="text-xs font-semibold text-cyan-400/80"
							initial={{ opacity: 0, y: -5 }}
							animate={{ opacity: 1, y: 0 }}
						>
							Ready! Tap "Start" below ↓
						</motion.div>
					)}
				</div>

				{startTournamentButton && (() => {
					const isReady = selectedCount >= 2;
					const buttonLabel = isReady
						? `Start Tournament (${selectedCount} names)`
						: `Select at least 2 names (${selectedCount} selected)`;
					
					return (
						<div className="relative flex flex-col items-center gap-1 w-full">
							<Button
								onClick={startTournamentButton.onClick}
								disabled={!isReady}
								className={cn(
									"relative inline-flex items-center justify-center gap-2 min-h-[46px] px-8 py-2 font-bold uppercase tracking-wider rounded-full transition-all duration-300 border",
									isReady
										? "bg-gradient-to-br from-purple-600 to-purple-800 text-white border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(168,85,247,0.6)]"
										: "bg-neutral-800 text-white/30 border-white/5 cursor-not-allowed grayscale opacity-50",
								)}
								aria-label={buttonLabel}
								startIcon={isReady ? <Plus className="w-4 h-4" /> : null}
							>
								{buttonLabel}
							</Button>
							{!isReady && selectedCount > 0 && (
								<span className="text-xs text-white/30" role="status" aria-live="polite">
									{selectedCount === 1
										? "Select 1 more name"
										: `Select ${2 - selectedCount} more names`}
								</span>
							)}
						</div>
					);
				})()}
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
						categories={categories}
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
						categories={categories}
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
