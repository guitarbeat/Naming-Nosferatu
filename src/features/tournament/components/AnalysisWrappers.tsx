import React, { useEffect } from "react";
import { AnalysisDashboard } from "../../../shared/components/AnalysisDashboard/AnalysisDashboard";
import { useNameManagementContextSafe } from "../../../shared/components/NameManagementView/NameManagementView";
import { useProfile } from "../../profile/hooks/useProfile";
import { useNameManagementCallbacks } from "../hooks/useTournamentSetupHooks";

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

interface AnalysisDashboardWrapperProps {
	stats: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any

	selectionStats: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	stats: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
				context?.refetch?.();
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
