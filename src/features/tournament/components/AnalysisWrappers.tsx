/**
 * @module AnalysisWrappers
 * @description Consolidated analysis wrappers for tournament setup
 * Includes AnalysisHandlersProvider, AnalysisDashboardWrapper, and AnalysisBulkActionsWrapper
 */

import type React from "react";
import { useCallback, useContext, useEffect, useMemo } from "react";
import Button from "../../../shared/components/Button";
import {
	NameManagementContext,
	useNameManagementContextOptional,
} from "../../../shared/components/NameManagementView/nameManagementCore";
import {
	devError,
	devLog,
	devWarn,
	exportTournamentResultsToCSV,
	extractNameIds,
	isNameHidden,
	selectedNamesToSet,
} from "../../../shared/utils";
import type { NameItem } from "../../../types/components";
import { AnalysisDashboard } from "../../analytics/components/AnalysisDashboard";
import type { HighlightItem, SummaryStats } from "../../analytics/types";
import { type SelectionStats, useProfile } from "../../../core/hooks/useProfile";
import { useNameManagementCallbacks } from "../hooks/useTournamentSetupHooks";

interface AnalysisHandlers {
	handleToggleVisibility: ((nameId: string) => Promise<void>) | undefined;
	handleDelete: ((name: NameItem) => Promise<void>) | undefined;
}

// ============================================================================
// AnalysisHandlersProvider
// ============================================================================

interface AnalysisHandlersProviderProps {
	activeUser: string | null;
	canManageActiveUser: boolean;
	handlersRef: React.MutableRefObject<AnalysisHandlers>;
	fetchSelectionStats?: () => void;
	showSuccess: (msg: string) => void;
	showError: (msg: string) => void;
	showToast?: (msg: string) => void;
}

/**
 * Component that creates handlers inside context and initializes analysis mode
 */
export function AnalysisHandlersProvider({
	activeUser,
	handlersRef,
	fetchSelectionStats: _fetchSelectionStats,
	showSuccess,
	showError,
}: AnalysisHandlersProviderProps) {
	// Use useContext directly instead of useNameManagementContextSafe to avoid throwing
	// if context is not available yet (e.g., during initial render)
	const context = useContext(NameManagementContext);

	// * Initialize analysis mode from URL or prop
	// Note: analysisMode is managed by the parent component (NameManagementView)
	// This component doesn't need to set it directly

	const { setAllNames, fetchNames } = useNameManagementCallbacks(context);

	const { handleToggleVisibility, handleDelete } = useProfile(activeUser || "", {
		showSuccess,
		showError,
		fetchNames,
		setAllNames,
	});

	useEffect(() => {
		if (!context) {
			return;
		}
		handlersRef.current.handleToggleVisibility = handleToggleVisibility;
		handlersRef.current.handleDelete = handleDelete;
	}, [context, handleToggleVisibility, handleDelete, handlersRef]);

	if (!context) {
		return null;
	}

	return null;
}

// ============================================================================
// AnalysisDashboardWrapper
// ============================================================================

interface AnalysisDashboardWrapperProps {
	stats: SummaryStats | null;
	selectionStats: SelectionStats | null;
	highlights?: { topRated?: HighlightItem[]; mostWins?: HighlightItem[] } | undefined;
	isAdmin?: boolean;
	activeUser?: string;
	onNameHidden?: () => void;
}

/**
 * Analysis Dashboard wrapper - no longer needs context
 * AnalysisDashboard fetches its own data and doesn't need highlights from context
 */
function AnalysisDashboardWrapper({
	stats,
	selectionStats: _selectionStats,
	highlights: propsHighlights,
	isAdmin = false,
	activeUser,
	onNameHidden,
}: AnalysisDashboardWrapperProps) {
	// * Only render if stats are available
	if (!stats) {
		return null;
	}

	return (
		<AnalysisDashboard
			highlights={propsHighlights}
			isAdmin={isAdmin}
			userName={activeUser}
			onNameHidden={onNameHidden}
		/>
	);
}

/**
 * Wrapper component factory to pass props to AnalysisDashboardWrapper
 * This creates a component function that can use hooks properly
 */
export const createAnalysisDashboardWrapper = (
	stats: SummaryStats | null,
	selectionStats: SelectionStats | null,
	isAdmin: boolean,
	activeUser: string | undefined,
	onNameHidden: (() => void) | undefined,
) => {
	return function AnalysisDashboardWrapperWithProps() {
		// * Get context inside the component - it's available here because this component
		// * is rendered inside NameManagementView's context provider
		const context = useNameManagementContextOptional();
		const handleNameHidden =
			onNameHidden ||
			(() => {
				// refetch is not available on context, use fetchNames if available
				if (context && "fetchNames" in context && typeof context.fetchNames === "function") {
					context.fetchNames();
				}
			});
		return (
			<AnalysisDashboardWrapper
				stats={stats}
				selectionStats={selectionStats}
				isAdmin={isAdmin}
				activeUser={activeUser}
				onNameHidden={handleNameHidden}
			/>
		);
	};
};

// ============================================================================
// AnalysisBulkActions Component
// ============================================================================

interface AnalysisBulkActionsProps {
	selectedCount: number;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onBulkHide: () => void;
	onBulkUnhide: () => void;
	onExport?: () => void;
	isAllSelected: boolean;
	showActions: boolean;
	isAdmin: boolean;
	totalCount: number;
}

// Style constants to avoid recreating objects on every render
const actionsContainerStyle = {
	display: "flex",
	gap: "var(--space-2)",
	alignItems: "center",
	flexWrap: "wrap",
	padding: "var(--space-3)",
} as const;

const selectedCountStyle = {
	fontSize: "var(--text-sm)",
	color: "var(--text-secondary)",
} as const;

function AnalysisBulkActions({
	selectedCount,
	onSelectAll,
	onDeselectAll,
	onBulkHide,
	onBulkUnhide,
	onExport,
	isAllSelected,
	showActions,
	isAdmin,
	totalCount,
}: AnalysisBulkActionsProps) {
	if (!showActions) {
		return null;
	}

	return (
		<div style={actionsContainerStyle}>
			<span style={selectedCountStyle}>
				{selectedCount} of {totalCount} selected
			</span>
			<Button
				variant="secondary"
				size="small"
				onClick={isAllSelected ? onDeselectAll : onSelectAll}
			>
				{isAllSelected ? "Deselect All" : "Select All"}
			</Button>
			{isAdmin && (
				<>
					<Button
						variant="secondary"
						size="small"
						onClick={onBulkHide}
						disabled={selectedCount === 0}
					>
						Hide Selected
					</Button>
					<Button
						variant="secondary"
						size="small"
						onClick={onBulkUnhide}
						disabled={selectedCount === 0}
					>
						Unhide Selected
					</Button>
				</>
			)}
			{onExport && (
				<Button variant="secondary" size="small" onClick={onExport}>
					Export CSV
				</Button>
			)}
		</div>
	);
}

// ============================================================================
// AnalysisBulkActionsWrapper
// ============================================================================

interface AnalysisBulkActionsWrapperProps {
	activeUser: string | null;
	canManageActiveUser: boolean;
	isAdmin: boolean;
	fetchSelectionStats?: () => void;
	showSuccess: (msg: string) => void;
	showError: (msg: string) => void;
	showToast?: (msg: string) => void;
	onExport?: () => void;
}

export function AnalysisBulkActionsWrapper({
	activeUser,
	canManageActiveUser,
	isAdmin,
	showSuccess,
	showError,
}: AnalysisBulkActionsWrapperProps) {
	const context = useNameManagementContextOptional();

	if (!context) {
		return null;
	}

	const selectedCount = context.selectedCount ?? 0;
	const selectedNamesValue = context.selectedNames;
	// * Keep both Set format for selection logic and original array for bulk operations
	const selectedNamesSet = useMemo(
		() => selectedNamesToSet(selectedNamesValue),
		[selectedNamesValue],
	);

	// * Extract name IDs from selectedNames, handling different formats
	const selectedNamesArray = useMemo(
		() => extractNameIds(selectedNamesValue),
		[selectedNamesValue],
	);

	const { setAllNames, fetchNames } = useNameManagementCallbacks(context);

	const { handleBulkHide, handleBulkUnhide } = useProfile(activeUser ?? "", {
		showSuccess,
		showError,
		fetchNames,
		setAllNames,
	});

	const contextNames = context.names;
	const contextFilterStatus = context.filterStatus;

	const filteredAndSortedNames = useMemo(() => {
		if (!contextNames || contextNames.length === 0) {
			return [];
		}
		let filtered = [...contextNames];

		// Use shared isNameHidden utility for consistent visibility check
		if (contextFilterStatus === "visible") {
			filtered = filtered.filter((name) => !isNameHidden(name));
		} else if (contextFilterStatus === "hidden") {
			filtered = filtered.filter((name) => isNameHidden(name));
		}
		// * "all" shows everything (no filtering)

		return filtered;
	}, [contextNames, contextFilterStatus]);

	const allVisibleSelected = useMemo(
		() =>
			filteredAndSortedNames.length > 0 &&
			filteredAndSortedNames.every((name) => selectedNamesSet.has(name.id)),
		[filteredAndSortedNames, selectedNamesSet],
	);

	const handleSelectAll = useCallback(() => {
		const visibleNameIds = filteredAndSortedNames.map((name) => name.id);
		if (visibleNameIds.length === 0) {
			return;
		}
		const shouldSelect = !allVisibleSelected;
		if (context.toggleNamesByIds) {
			context.toggleNamesByIds(
				visibleNameIds.map((id) => String(id)),
				shouldSelect,
			);
			return;
		}
		visibleNameIds.forEach((id) => {
			context.toggleNameById?.(String(id), shouldSelect);
		});
	}, [
		allVisibleSelected,
		filteredAndSortedNames,
		context.toggleNamesByIds,
		context.toggleNameById,
	]);

	const handleExport = useCallback(() => {
		try {
			const success = exportTournamentResultsToCSV(
				filteredAndSortedNames,
				"naming_nosferatu_export",
			);
			if (!success) {
				showError("Failed to export tournament results. Please try again.");
			}
		} catch (error) {
			devError("[TournamentSetup] Error exporting tournament results:", error);
			showError("Failed to export tournament results. Please try again.");
		}
	}, [filteredAndSortedNames, showError]);

	const handleBulkHideCallback = useCallback(async () => {
		devLog("[TournamentSetup] onBulkHide called", {
			selectedCount,
			selectedNamesArrayLength: selectedNamesArray.length,
			selectedNamesArray,
			contextSelectedNames: context.selectedNames,
		});

		if (selectedNamesArray.length === 0) {
			devWarn(
				"[TournamentSetup] No names in selectedNamesArray despite selectedCount:",
				selectedCount,
			);
			showError("Please select at least one name to continue");
			return;
		}

		try {
			await handleBulkHide(selectedNamesArray.map((id) => id.toString()));
		} catch (error) {
			devError("[TournamentSetup] Error calling handleBulkHide:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			showError(`Unable to hide names: ${errorMessage}`);
		}
	}, [selectedCount, selectedNamesArray, context.selectedNames, showError, handleBulkHide]);

	const handleBulkUnhideCallback = useCallback(async () => {
		if (selectedNamesArray.length === 0) {
			showError("Please select at least one name to continue");
			return;
		}
		try {
			await handleBulkUnhide(selectedNamesArray.map((id) => id.toString()));
		} catch (error) {
			devError("[TournamentSetup] Error calling handleBulkUnhide:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			showError(`Unable to unhide names: ${errorMessage}`);
		}
	}, [selectedNamesArray, showError, handleBulkUnhide]);

	if (!canManageActiveUser || filteredAndSortedNames.length === 0) {
		return null;
	}

	return (
		<AnalysisBulkActions
			selectedCount={selectedCount}
			onSelectAll={handleSelectAll}
			onDeselectAll={handleSelectAll}
			onBulkHide={handleBulkHideCallback}
			onBulkUnhide={handleBulkUnhideCallback}
			onExport={handleExport}
			isAllSelected={allVisibleSelected}
			showActions={true}
			isAdmin={isAdmin}
			totalCount={filteredAndSortedNames.length}
		/>
	);
}
