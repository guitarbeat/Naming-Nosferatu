/**
 * @module NameManagementView
 * @description Unified view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorComponent, Loading } from "../CommonUI";
import { ProfileMode } from "./modes/ProfileMode";
import { TournamentMode } from "./modes/TournamentMode";
import styles from "./NameManagementView.module.css";
// Consolidated imports
import {
	type NameItem,
	NameManagementProvider,
	type NameManagementViewExtensions,
	type UseNameManagementViewProps,
	useNameManagementView,
} from "./nameManagementCore";
import { useToast } from "../../providers";

interface NameManagementViewProps extends UseNameManagementViewProps {
	className?: string; // Kept for API compatibility, but might be unused if modes handle containers
	onStartTournament?: (selectedNames: NameItem[]) => void;
	onOpenSuggestName?: () => void;
	extensions?: NameManagementViewExtensions;
}

export function NameManagementView({
	mode = "tournament", // Default mode
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
	const { showToast } = useToast();

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
		selectedCount,
		clearErrors,
		handleFilterChange,
	} = state;

	// * Feedback Side Effects
	useEffect(() => {
		if (isError && dataError) {
			showToast({
				message: dataError.message || "An error occurred while loading data",
				type: "error",
			});
		}
	}, [isError, dataError, showToast]);

	const handleStartTournament = useCallback(
		(namesToStart: NameItem[]) => {
			if (onStartTournament) {
				showToast({
					message: "Starting tournament...",
					type: "success",
					duration: 2000,
				});
				onStartTournament(namesToStart);
			}
		},
		[onStartTournament, showToast],
	);

	const contextValue = useMemo(
		() => ({
			names,
			selectedNames,
			toggleName: state.toggleName,
			toggleNameById: state.toggleNameById,
			toggleNamesByIds: state.toggleNamesByIds,
			selectAll: state.selectAll,
			clearSelection: state.clearSelection,
			isSelected: state.isSelected,
			selectedCount,
			totalCount: names.length,
			mode: mode || "tournament",
			handleFilterChange,
			onStartTournament: handleStartTournament,
		}),
		[
			names,
			selectedNames,
			state.toggleName,
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

	const renderContent = () => {
		// 1. Dashboard Mode (Analysis or Profile Dashboard via extension)
		if (analysisMode && extensions.dashboard) {
			return (
				<div
					className={`${styles.container} ${className}`}
					data-component="name-management-view"
					data-mode="analysis"
				>
					{extensions.header && (
						<div className={styles.headerSection}>
							{typeof extensions.header === "function"
								? extensions.header()
								: extensions.header}
						</div>
					)}
					<section className={styles.dashboardSection}>
						{React.isValidElement(extensions.dashboard)
							? extensions.dashboard
							: typeof extensions.dashboard === "function"
								? React.createElement(
										extensions.dashboard as React.ComponentType,
									)
								: extensions.dashboard}
					</section>
				</div>
			);
		}

		// 2. Tournament Mode
		if (mode === "tournament") {
			return (
				<TournamentMode
					{...state}
					// Pass specific props that might not be in state
					categories={tournamentProps.categories}
					onStartTournament={handleStartTournament}
					onOpenSuggestName={onOpenSuggestName}
					extensions={extensions}
					isAdmin={profileProps.isAdmin || tournamentProps.isAdmin}
					imageList={tournamentProps.imageList}
					SwipeableCards={tournamentProps.SwipeableCards}
					totalCount={names.length}
					filteredCount={state.filteredNamesForSwipe.length}
				/>
			);
		}

		// 3. Profile Mode
		return (
			<ProfileMode
				{...state}
				extensions={extensions}
				profileProps={profileProps}
				categories={tournamentProps.categories} // Profile might use categories
			/>
		);
	};

	return (
		<>
			{isError && (
				<ErrorComponent
					error={dataError?.message || "An error occurred"}
					onRetry={state.refetch}
					onDismiss={clearErrors}
				/>
			)}

			<NameManagementProvider value={contextValue}>
				{/* Context Logic Extension */}
				{extensions.contextLogic &&
					(typeof extensions.contextLogic === "function"
						? extensions.contextLogic()
						: extensions.contextLogic)}

				{renderContent()}
			</NameManagementProvider>
		</>
	);
}

export default NameManagementView;
