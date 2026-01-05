/**
 * @module AnalysisWrappers
 * @description Consolidated analysis wrappers for tournament setup
 * Includes AnalysisHandlersProvider, AnalysisDashboardWrapper, and AnalysisBulkActionsWrapper
 */

import React, { useCallback, useEffect, useMemo } from "react";
import { AnalysisDashboard } from "../../../shared/components/AnalysisDashboard/AnalysisDashboard";
import { AnalysisBulkActions } from "../../../shared/components/AnalysisDashboard/components/AnalysisBulkActions";
import { useNameManagementContextSafe } from "../../../shared/components/NameManagementView/nameManagementCore";
import type { NameItem } from "../../../shared/propTypes";
import {
	devError,
	devLog,
	devWarn,
	exportTournamentResultsToCSV,
	extractNameIds,
	isNameHidden,
	selectedNamesToSet,
} from "../../../shared/utils/core";
import { useProfile } from "../../profile/hooks/useProfile";
import { useNameManagementCallbacks } from "../hooks/useTournamentSetupHooks";

// ============================================================================
// AnalysisHandlersProvider
// ============================================================================

interface AnalysisHandlersProviderProps {
	shouldEnableAnalysisMode: boolean;
	activeUser: string | null;
	canManageActiveUser: boolean;
	handlersRef: React.MutableRefObject<any>;
	fetchSelectionStats?: () => void;
	showSuccess: (msg: string) => void;
	showError: (msg: string) => void;
	showToast?: (msg: string) => void;
}

/**
 * Component that creates handlers inside context and initializes analysis mode
 */
export function AnalysisHandlersProvider({
	shouldEnableAnalysisMode,
	activeUser,
	handlersRef,
	fetchSelectionStats: _fetchSelectionStats,
	showSuccess,
	showError,
}: AnalysisHandlersProviderProps) {
	const context = useNameManagementContextSafe();

	// * Initialize analysis mode from URL or prop
	useEffect(() => {
		if (!context) return;

		const ctx = context as any;
		if (shouldEnableAnalysisMode && !ctx.analysisMode) {
			ctx.setAnalysisMode(true);
		}
	}, [shouldEnableAnalysisMode, context]);

	const { setAllNames, fetchNames } = useNameManagementCallbacks(context);

	const { handleToggleVisibility, handleDelete } = useProfile(
		activeUser || "",
		{
			showSuccess,
			showError,
			fetchNames,
			setAllNames,
		},
	);

	React.useEffect(() => {
		if (!context) return;
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
	stats: any;
	selectionStats: any;
	highlights?: any;
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
	if (!stats) return null;

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
	stats: any,
	selectionStats: any,
	isAdmin: boolean,
	activeUser: string | undefined,
	onNameHidden: (() => void) | undefined,
) => {
	return function AnalysisDashboardWrapperWithProps() {
		// * Get context inside the component - it's available here because this component
		// * is rendered inside NameManagementView's context provider
		const context = useNameManagementContextSafe();
		const handleNameHidden =
			onNameHidden ||
			(() => {
				// refetch is not available on context, use fetchNames if available
				if (
					context &&
					"fetchNames" in context &&
					typeof context.fetchNames === "function"
				) {
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
	const context = useNameManagementContextSafe();

	const selectedCount = context?.selectedCount ?? 0;
	const selectedNamesValue = context?.selectedNames as any;
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

	const contextNames = context?.names as NameItem[] | undefined;
	const contextFilterStatus = (context as any)?.filterStatus;

	const filteredAndSortedNames = useMemo(() => {
		if (!contextNames || contextNames.length === 0) return [];
		let filtered = [...contextNames];

		// Use shared isNameHidden utility for consistent visibility check
		if (contextFilterStatus === "visible") {
			filtered = filtered.filter((name) => !isNameHidden(name as NameItem));
		} else if (contextFilterStatus === "hidden") {
			filtered = filtered.filter((name) => isNameHidden(name as NameItem));
		}
		// * "all" shows everything (no filtering)

		return filtered;
	}, [contextNames, contextFilterStatus]);

	const allVisibleSelected =
		filteredAndSortedNames.length > 0 &&
		filteredAndSortedNames.every((name) => selectedNamesSet.has(name.id));

	const handleSelectAll = useCallback(() => {
		const visibleNameIds = filteredAndSortedNames.map((name) => name.id);
		if (visibleNameIds.length === 0) {
			return;
		}
		const shouldSelect = !allVisibleSelected;
		if ((context as any)?.toggleNamesByIds) {
			(context as any).toggleNamesByIds(visibleNameIds, shouldSelect);
			return;
		}
		visibleNameIds.forEach((id) => {
			context?.toggleNameById?.(String(id), shouldSelect);
		});
	}, [allVisibleSelected, filteredAndSortedNames, context]);

	const handleExport = useCallback(() => {
		exportTournamentResultsToCSV(
			filteredAndSortedNames as any,
			"naming_nosferatu_export",
		);
	}, [filteredAndSortedNames]);

	if (!context || !canManageActiveUser || filteredAndSortedNames.length === 0) {
		return null;
	}

	return (
		<AnalysisBulkActions
			selectedCount={selectedCount}
			onSelectAll={handleSelectAll}
			onDeselectAll={handleSelectAll}
			onBulkHide={() => {
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
					showError("No names selected");
					return;
				}

				try {
					handleBulkHide(selectedNamesArray as string[]);
				} catch (error) {
					devError("[TournamentSetup] Error calling handleBulkHide:", error);
					showError(
						`Failed to hide names: ${(error as any).message || "Unknown error"}`,
					);
				}
			}}
			onBulkUnhide={() => {
				if (selectedNamesArray.length === 0) {
					showError("No names selected");
					return;
				}
				handleBulkUnhide(selectedNamesArray as string[]);
			}}
			onExport={handleExport}
			isAllSelected={allVisibleSelected}
			showActions={true}
			isAdmin={isAdmin}
			totalCount={filteredAndSortedNames.length}
		/>
	);
}
