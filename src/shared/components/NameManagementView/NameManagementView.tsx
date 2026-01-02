/**
 * @module NameManagementView
 * @description Unified view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import PropTypes from "prop-types";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import Button from "../Button/Button";
import ErrorComponent from "../Error/Error";
import Loading from "../Loading/Loading";
import { TournamentToolbar } from "../TournamentToolbar/TournamentToolbar";

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

import { NameGrid } from "../NameGrid/NameGrid";
import { useNameData, useNameSelection } from "./useNameManagement";

interface Name {
	id: string;
	name: string;
	[key: string]: unknown;
}

import { FILTER_OPTIONS } from "../../../core/constants";
import { useRouting } from "../../../core/hooks/useRouting";
import useAppStore from "../../../core/store/useAppStore";
import {
	applyNameFilters,
	exportTournamentResultsToCSV,
	mapFilterStatusToVisibility,
} from "../../utils/coreUtils";
import styles from "./NameManagementView.module.css";

interface NameItem {
	id: string | number;
	name: string;
	description?: string;
	avg_rating?: number;
	popularity_score?: number;
	[key: string]: unknown;
}

// * Context for providing data to extensions
interface NameManagementContextType {
	names: unknown[];
	selectedNames: unknown;
	toggleName: (nameOrId: unknown) => void;
	toggleNameById: (nameId: string, selected: boolean) => void;
	toggleNamesByIds: (nameIds: string[]) => void;
	selectedCount: number;
	hiddenIds: Set<string>;
	filterConfig: Record<string, unknown>;
	refetch: () => void;
	setNames: (names: unknown[]) => void;
	showSelectedOnly: boolean;
	setShowSelectedOnly: (value: boolean) => void;
	selectedCategory: string | null;
	setSelectedCategory: (value: string | null) => void;
	searchTerm: string;
	setSearchTerm: (value: string) => void;
	sortBy: string;
	setSortBy: (value: string) => void;
	isSwipeMode: boolean;
	setIsSwipeMode: (value: boolean) => void;
	showCatPictures: boolean;
	setShowCatPictures: (value: boolean) => void;
	filterStatus: string;
	setFilterStatus: (value: string) => void;
	userFilter: string;
	setUserFilter: (value: string) => void;
	sortOrder: string;
	setSortOrder: (value: string) => void;
	selectionFilter: string;
	setSelectionFilter: (value: string) => void;
	dateFilter: string;
	setDateFilter: (value: string) => void;
	analysisMode: boolean;
	setAnalysisMode: (value: boolean) => void;
	categories: string[];
	filteredCount: number;
	totalCount: number;
	profileProps: Record<string, unknown>;
	tournamentProps: Record<string, unknown>;
	mode: string;
	handleFilterChange: (name: string, value: string) => void;
	onStartTournament?: (selectedNames: unknown) => void;
	[key: string]: unknown;
}
const NameManagementContext = createContext<NameManagementContextType | null>(
	null,
);

/**
 * Safe hook to get NameManagementContext - returns null if not available
 * Use this when the context is optional (e.g., in extension components)
 */
export function useNameManagementContextSafe() {
	const context = useContext(NameManagementContext);
	return context; // * Returns null if not available
}

/**
 * Unified Name Management View Component
 * @param {Object} props
 * @param {string} props.mode - Display mode: 'tournament' or 'profile'
 * @param {string} props.userName - Current user name
 * @param {Function} props.onStartTournament - Handler for starting tournament (tournament mode only)
 * @param {Object} props.extensions - Mode-specific extension components
 * @param {ReactNode} props.extensions.header - Custom header component
 * @param {ReactNode} props.extensions.dashboard - Dashboard component (profile mode)
 * @param {ReactNode} props.extensions.bulkActions - Bulk actions component (profile mode)
 * @param {ReactNode} props.extensions.navbar - Navbar component (tournament mode)
 * @param {ReactNode} props.extensions.lightbox - Lightbox component (tournament mode)
 * @param {ReactNode} props.extensions.nameSuggestion - Name suggestion component (tournament mode)
 * @param {Object} props.tournamentProps - Tournament-specific props
 * @param {Array} props.tournamentProps.categories - Available categories
 * @param {Function} props.tournamentProps.SwipeableCards - Swipeable cards component
 * @param {boolean} props.tournamentProps.isAdmin - Admin status
 * @param {Object} props.profileProps - Profile-specific props
 * @param {Function} props.profileProps.onToggleVisibility - Visibility toggle handler
 * @param {Function} props.profileProps.onDelete - Delete handler
 * @param {Set} props.profileProps.hiddenIds - Set of hidden name IDs
 * @param {Object} props.profileProps.stats - Profile statistics
 * @param {Object} props.profileProps.selectionStats - Selection statistics
 * @param {Object} props.profileProps.highlights - Profile highlights
 */
interface NameManagementViewExtensions {
	header?: React.ReactNode | (() => React.ReactNode);
	dashboard?: React.ReactNode | React.ComponentType | (() => React.ReactNode);
	bulkActions?:
		| React.ReactNode
		| React.ComponentType<{ onExport?: () => void }>;
	navbar?: React.ReactNode | (() => React.ReactNode);
	lightbox?: React.ReactNode | (() => React.ReactNode);
	nameSuggestion?: React.ReactNode | (() => React.ReactNode);
	nameGrid?: React.ReactNode | React.ReactElement | (() => React.ReactNode);
	contextLogic?: React.ReactNode | (() => React.ReactNode);
}

interface NameManagementViewTournamentProps {
	categories?: string[];
	SwipeableCards?: React.ComponentType<any>;
	isAdmin?: boolean;
	imageList?: string[];
	gridClassName?: string;
}

interface NameManagementViewProfileProps {
	onToggleVisibility?: (id: string | number) => void;
	onDelete?: (name: NameItem) => void;
	hiddenIds?: Set<string>;
	stats?: Record<string, unknown>;
	selectionStats?: Record<string, unknown>;
	highlights?: Record<string, unknown>;
	isAdmin?: boolean;
	showUserFilter?: boolean;
	userOptions?: Array<{ value: string; label: string }>;
	userFilter?: string;
	setUserFilter?: (value: string) => void;
}

// NameManagementView is only used in TournamentSetup.jsx (entry point)
// Export required for import in TournamentSetup.jsx
// ts-prune-ignore-next (used in TournamentSetup)
export function NameManagementView({
	mode = "tournament",
	userName,
	onStartTournament,
	onOpenSuggestName = () => {},
	extensions = {} as NameManagementViewExtensions,
	tournamentProps = {} as NameManagementViewTournamentProps,
	profileProps = {} as NameManagementViewProfileProps,
	className = "",
}: {
	mode?: "tournament" | "profile";
	userName: string;
	onStartTournament?: (selectedNames: unknown[]) => void;
	onOpenSuggestName?: () => void;
	extensions?: NameManagementViewExtensions;
	tournamentProps?: NameManagementViewTournamentProps;
	profileProps?: NameManagementViewProfileProps;
	className?: string;
}) {
	// * Unified data fetching
	const {
		names,
		hiddenIds,
		isLoading,
		error: dataError,
		refetch,
		setNames,
	} = useNameData({ userName, mode: mode as "tournament" | "profile" });

	// * Unified selection management
	const {
		selectedNames,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll: _selectAll,
		selectedCount,
	} = useNameSelection({
		names,
		mode: mode as "tournament" | "profile",
		userName,
	});

	// * Get error state from store (tournament mode)
	const { errors, errorActions } = useAppStore();
	const isError = mode === "tournament" && (!!errors.current || !!dataError);
	const clearErrors = () => errorActions.clearError();
	const clearError = () => errorActions.clearError();

	// * Tournament mode: filter state
	const [showSelectedOnly, setShowSelectedOnly] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("alphabetical");
	// * Get UI state and actions from store
	const { ui, uiActions } = useAppStore();
	const { isSwipeMode, showCatPictures } = ui;
	const { setSwipeMode: setIsSwipeMode, setCatPictures: setShowCatPictures } =
		uiActions;

	// * Profile mode: filter state
	const [filterStatus, setFilterStatus] = useState(
		FILTER_OPTIONS.VISIBILITY.VISIBLE,
	);
	// * Use userFilter from profileProps if available, otherwise use local state
	const [localUserFilter, setLocalUserFilter] = useState("all");
	const userFilter = profileProps.userFilter ?? localUserFilter;
	const setUserFilter = profileProps.setUserFilter ?? setLocalUserFilter;
	const [sortOrder, setSortOrder] = useState("desc");
	const [selectionFilter, setSelectionFilter] = useState("all");
	const [dateFilter, setDateFilter] = useState("all");
	const [filteredCount] = useState(0);

	// * Routing hook for URL updates
	const { navigateTo } = useRouting();

	// * Analysis mode: toggle for showing profile features in tournament mode
	// * Initialize from URL parameter
	const urlParams = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	);
	const [analysisMode, setAnalysisMode] = useState(
		urlParams.get("analysis") === "true",
	);

	// * Sync analysis mode with URL
	const handleAnalysisModeToggle = useCallback(
		(newValue: boolean) => {
			setAnalysisMode(newValue);
			const currentPath = window.location.pathname;
			const currentSearch = new URLSearchParams(window.location.search);

			if (newValue) {
				currentSearch.set("analysis", "true");
			} else {
				currentSearch.delete("analysis");
			}

			const newSearch = currentSearch.toString();
			const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;

			navigateTo(newUrl);
		},
		[navigateTo],
	);

	// * Sync analysis mode state when URL changes (e.g., from keyboard shortcut)
	useEffect(() => {
		const checkUrl = () => {
			const params = new URLSearchParams(window.location.search);
			const urlAnalysisMode = params.get("analysis") === "true";
			if (urlAnalysisMode !== analysisMode) {
				setAnalysisMode(urlAnalysisMode);
			}
		};

		// * Check on mount and when URL changes
		checkUrl();
		window.addEventListener("popstate", checkUrl);
		return () => window.removeEventListener("popstate", checkUrl);
	}, [analysisMode]);

	// * Tournament mode: categories
	const categories = tournamentProps.categories || [];

	// * Names are passed directly to child components which handle their own filtering
	const displayNames = names;

	// * Calculate filtered names for SwipeableCards (which expects pre-filtered list)
	const filteredNamesForSwipe = useMemo(() => {
		// Only calculate if we need it (swipe mode)
		if (mode !== "tournament") return [];

		// In tournament mode, filtering is managed by tournament props/state
		// Actually tournament mode usually doesn't have filterStatus in the same way as profile,
		// but we have tournamentFilterConfig below.

		// Let's use the same config logic as NameGrid would use
		const activeFilterStatus = analysisMode ? filterStatus : "visible";
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			searchTerm,
			category: selectedCategory,
			sortBy,
			sortOrder: sortOrder as "asc" | "desc", // TournamentToolbar uses sortOrder
			visibility: activeVisibility,
			isAdmin: profileProps.isAdmin,
		});

		if (showSelectedOnly) {
			result = result.filter((name) => {
				// Check if name is in selectedNames
				// selectedNames can be array or set depending on implementation,
				// but useNameSelection returns array in `selectedNames` and we have `selectedCount`.
				// Wait, `selectedNames` from useNameSelection is array.
				// Let's assume it's an array of objects.
				return (selectedNames as { id: string }[]).some(
					(s) => s.id === name.id,
				);
			});
		}

		return result;
	}, [
		names,
		mode,
		analysisMode,
		filterStatus,
		searchTerm,
		selectedCategory,
		sortBy,
		sortOrder,
		profileProps.isAdmin,
		showSelectedOnly,
		selectedNames,
	]);

	// * Filter configuration for TournamentToolbar
	const filterConfig = useMemo(() => {
		// * In tournament mode with analysis mode, show hybrid filters
		if (mode === "tournament" && analysisMode) {
			return {
				searchTerm,
				category: selectedCategory,
				sortBy,
				filterStatus,
				userFilter,
				selectionFilter,
				dateFilter,
				sortOrder,
			};
		} else if (mode === "tournament") {
			return {
				searchTerm,
				category: selectedCategory,
				sortBy,
				sortOrder,
			};
		} else {
			return {
				filterStatus,
				userFilter,
				selectionFilter,
				sortBy,
				sortOrder,
			};
		}
	}, [
		mode,
		analysisMode,
		searchTerm,
		selectedCategory,
		sortBy,
		filterStatus,
		userFilter,
		selectionFilter,
		dateFilter,
		sortOrder,
	]);

	// * Handle filter changes - new API: (name, value)
	const handleFilterChange = useCallback(
		(name: string, value: string) => {
			// * Tournament mode with analysis mode: handle both filter sets
			if (mode === "tournament" && analysisMode) {
				switch (name) {
					case "searchTerm":
						setSearchTerm(value || "");
						break;
					case "category":
						setSelectedCategory(value || null);
						break;
					case "sortBy":
						setSortBy(value || "alphabetical");
						break;
					case "filterStatus":
						setFilterStatus(value);
						break;
					case "userFilter":
						setUserFilter(value);
						break;
					case "selectionFilter":
						setSelectionFilter(value);
						break;
					case "dateFilter":
						setDateFilter(value || "all");
						break;
					case "sortOrder":
						setSortOrder(value);
						break;
					default:
						break;
				}
			} else if (mode === "tournament") {
				switch (name) {
					case "searchTerm":
						setSearchTerm(value || "");
						break;
					case "category":
						setSelectedCategory(value || null);
						break;
					case "sortBy":
						setSortBy(value || "alphabetical");
						break;
					default:
						break;
				}
			} else {
				// Profile mode
				switch (name) {
					case "searchTerm":
						setSearchTerm(value || "");
						break;
					case "filterStatus":
						setFilterStatus(value);
						break;
					case "userFilter":
						setUserFilter(value);
						break;
					case "selectionFilter":
						setSelectionFilter(value);
						break;
					case "dateFilter":
						setDateFilter(value || "all");
						break;
					case "sortBy":
						setSortBy(value);
						break;
					case "sortOrder":
						setSortOrder(value);
						break;
					default:
						break;
				}
			}
		},
		[mode, analysisMode, setUserFilter],
	);

	// * Context value for extensions
	const contextValue = useMemo(
		() =>
			({
				names: names as unknown[],
				selectedNames: selectedNames as unknown,
				toggleName: toggleName as (nameOrId: unknown) => void,
				toggleNameById,
				toggleNamesByIds,
				selectedCount,
				hiddenIds,
				filterConfig: filterConfig as Record<string, unknown>,
				refetch,
				setNames: setNames as (names: unknown[]) => void,
				// Tournament-specific
				showSelectedOnly,
				setShowSelectedOnly,
				selectedCategory,
				setSelectedCategory,
				searchTerm,
				setSearchTerm,
				sortBy,
				setSortBy,
				isSwipeMode,
				setIsSwipeMode,
				showCatPictures,
				setShowCatPictures,
				// Profile-specific
				filterStatus,
				setFilterStatus,
				userFilter: userFilter as string,
				setUserFilter: setUserFilter as (value: string) => void,
				sortOrder,
				setSortOrder,
				selectionFilter,
				setSelectionFilter,
				dateFilter,
				setDateFilter,
				// Analysis mode
				analysisMode,
				setAnalysisMode: handleAnalysisModeToggle,
				// Additional data for toolbar integration
				categories: tournamentProps.categories || [],
				filteredCount,
				totalCount: names.length,
				profileProps: profileProps as Record<string, unknown>,
				tournamentProps: tournamentProps as Record<string, unknown>,
				mode,
				handleFilterChange,
				onStartTournament,
			}) as NameManagementContextType,
		[
			names,
			selectedNames,
			toggleName,
			toggleNameById,
			toggleNamesByIds,
			selectedCount,
			hiddenIds,
			filterConfig,
			refetch,
			setNames,
			filteredCount,
			tournamentProps,
			profileProps,
			mode,
			handleFilterChange,
			// State values
			showSelectedOnly,
			selectedCategory,
			searchTerm,
			sortBy,
			isSwipeMode,
			setIsSwipeMode,
			showCatPictures,
			setShowCatPictures,
			filterStatus,
			userFilter,
			setUserFilter,
			sortOrder,
			selectionFilter,
			dateFilter,
			analysisMode,
			handleAnalysisModeToggle,
			onStartTournament,
		],
	);

	// * Memoize TournamentToolbar props for tournament mode (must be before all early returns)
	const tournamentFilterConfig = useMemo(
		() =>
			({
				searchTerm,
				category: selectedCategory || undefined,
				sortBy,
				sortOrder,
			}) as {
				searchTerm?: string;
				category?: string;
				sortBy?: string;
				sortOrder?: string;
			},
		[searchTerm, selectedCategory, sortBy, sortOrder],
	);

	// * Loading state - check after all hooks
	if (isLoading) {
		return <Loading variant="spinner" />;
	}

	// * Error state (tournament mode) - check after all hooks
	if (isError && mode === "tournament") {
		return (
			<div className={styles.container}>
				<div className={styles.header}>
					<h2>Error Loading Names</h2>
					<ErrorComponent
						variant="list"
						error={errors.current ? [errors.current] : []}
						onRetry={() => window.location.reload()}
						onDismiss={clearError}
						onClearAll={clearErrors}
						showDetails={process.env.NODE_ENV === "development"}
					/>
				</div>
			</div>
		);
	}

	// * Empty state - check after all hooks
	if (names.length === 0) {
		return (
			<div className={styles.container}>
				<h2>
					{mode === "tournament" ? "No Names Available" : "No Data Available"}
				</h2>
				<p className={styles.errorMessage}>
					{mode === "tournament"
						? "There are no names available for the tournament at this time."
						: "No names found in your profile."}
				</p>
			</div>
		);
	}

	return (
		<>
			{/* TournamentToolbar with Start Tournament button (tournament mode) */}
			{/* Note: In analysis mode, toolbar is integrated into CollapsibleHeader via dashboard extension */}
			{mode === "tournament" && !analysisMode && (
				<TournamentToolbar
					mode="tournament"
					filters={tournamentFilterConfig as TournamentFilters}
					onFilterChange={
						handleFilterChange as (name: string, value: string) => void
					}
					categories={categories}
					showUserFilter={profileProps.showUserFilter}
					showSelectionFilter={!!profileProps.selectionStats}
					userOptions={
						profileProps.userOptions as
							| Array<{ value: string; label: string }>
							| null
							| undefined
					}
					filteredCount={names.length}
					totalCount={names.length}
					analysisMode={false}
					startTournamentButton={
						selectedCount >= 2 && onStartTournament
							? {
									onClick: () => onStartTournament(selectedNames as unknown[]),
									selectedCount,
								}
							: undefined
					}
					onOpenSuggestName={onOpenSuggestName}
				/>
			)}
			<NameManagementContext value={contextValue}>
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
					{/* Analysis Mode Banner - Removed per user request */}

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

					{/* Analysis mode is handled via extensions.dashboard (AnalysisDashboard) */}

					{/* Tournament Toolbar - Only for profile/hybrid mode (tournament mode filters are rendered above) */}
					{/* Note: In analysis mode, toolbar is integrated into CollapsibleHeader via dashboard extension */}
					{mode !== "tournament" && !analysisMode && (
						<section
							className={styles.filtersSection}
							aria-label="Filter and search controls"
							data-section="filters"
						>
							<TournamentToolbar
								mode={mode as "tournament" | "profile" | "hybrid"}
								filters={filterConfig as TournamentFilters}
								onFilterChange={
									handleFilterChange as (name: string, value: string) => void
								}
								categories={categories}
								showUserFilter={profileProps.showUserFilter}
								showSelectionFilter={!!profileProps.selectionStats}
								userOptions={
									profileProps.userOptions as
										| Array<{ value: string; label: string }>
										| null
										| undefined
								}
								filteredCount={filteredCount}
								totalCount={names.length}
							/>
						</section>
					)}

					{/* Tournament Mode: Header Actions - hidden when custom nameGrid is used (actions are in ResultsInfo) */}
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

							{/* View mode toggles - only show when not in analysis mode */}
							{!analysisMode && <>{/* Toggles moved to AppNavbar */}</>}

							{/* * Start Tournament button removed - now handled by TournamentToolbar above */}
							{/* * This section only shows when !extensions.nameGrid, but TournamentToolbar always shows the button */}
						</nav>
					)}

					{/* Tournament Mode: Progress Bar - hidden when custom nameGrid is used (it includes ResultsInfo) */}
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

					{/* Profile Mode: Bulk Actions (profile mode or analysis mode) */}
					{(mode === "profile" || (mode === "tournament" && analysisMode)) &&
						extensions.bulkActions && (
							<section
								className={styles.bulkActionsSection}
								aria-label="Bulk actions"
								data-section="bulk-actions"
							>
								{typeof extensions.bulkActions === "function"
									? React.createElement(extensions.bulkActions, {
											onExport: () => {
												exportTournamentResultsToCSV(
													displayNames,
													"naming_nosferatu_export",
												);
											},
										})
									: null}
							</section>
						)}

					{/* Name Grid - Use extension if provided, otherwise use NameGrid */}
					{/* * Always show extension (handles swipe mode internally), but hide default NameGrid in swipe mode */}
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
							// * Render SwipeableCards if in swipe mode and component provided
							React.createElement(tournamentProps.SwipeableCards, {
								names: filteredNamesForSwipe as unknown[],
								selectedNames: selectedNames as unknown[],
								onToggleName: (name: unknown) =>
									toggleName(name as string | Name),
								isAdmin: profileProps.isAdmin,
								showCatPictures: showCatPictures,
								imageList: tournamentProps.imageList,
								onStartTournament: onStartTournament
									? (names: unknown[]) => onStartTournament(names)
									: undefined,
							})
						) : !(mode === "tournament" && isSwipeMode) ? (
							<NameGrid
								names={displayNames as NameItem[]}
								selectedNames={selectedNames as NameItem[]}
								onToggleName={(name: NameItem) => {
									toggleName(name as any);
								}}
								filters={filterConfig as any}
								isAdmin={tournamentProps.isAdmin || profileProps.isAdmin}
								showSelectedOnly={showSelectedOnly}
								showCatPictures={showCatPictures}
								imageList={tournamentProps.imageList}
								onToggleVisibility={profileProps.onToggleVisibility}
								onDelete={profileProps.onDelete}
								isLoading={isLoading}
								className={tournamentProps.gridClassName}
							/>
						) : null}
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
			</NameManagementContext>
		</>
	);
}

NameManagementView.propTypes = {
	mode: PropTypes.oneOf(["tournament", "profile"]),
	userName: PropTypes.string.isRequired,
	onStartTournament: PropTypes.func,
	extensions: PropTypes.shape({
		header: PropTypes.node,
		dashboard: PropTypes.node,
		bulkActions: PropTypes.node,
		navbar: PropTypes.node,
		lightbox: PropTypes.node,
		nameSuggestion: PropTypes.node,
		nameGrid: PropTypes.node,
	}),
	tournamentProps: PropTypes.shape({
		categories: PropTypes.arrayOf(PropTypes.string),
		SwipeableCards: PropTypes.elementType,
		isAdmin: PropTypes.bool,
		imageList: PropTypes.arrayOf(PropTypes.string),
		gridClassName: PropTypes.string,
	}),
	profileProps: PropTypes.shape({
		onToggleVisibility: PropTypes.func,
		onDelete: PropTypes.func,
		stats: PropTypes.object,
		selectionStats: PropTypes.object,
		highlights: PropTypes.object,
		isAdmin: PropTypes.bool,
		showUserFilter: PropTypes.bool,
		userOptions: PropTypes.array,
	}),
	className: PropTypes.string,
};
