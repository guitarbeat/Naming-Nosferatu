/**
 * @module NameManagementView
 * @description Shared view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useToast } from "../../providers";
import { ErrorComponent } from "../ErrorComponent";
import { ProfileMode } from "./modes/ProfileMode";
import { type SwipeableCardsProps, TournamentMode } from "./modes/TournamentMode";
import styles from "./NameManagementView.module.css";
import {
	type NameItem,
	NameManagementProvider,
	type NameManagementViewExtensions,
	type UseNameManagementViewProps,
	useNameManagementView,
} from "./nameManagementCore";

interface NameManagementViewProps extends UseNameManagementViewProps {
	className?: string; // Kept for API compatibility, but might be unused if modes handle containers
	onStartTournament?: (selectedNames: NameItem[]) => void;

	extensions?: NameManagementViewExtensions;
	tournamentProps?: Record<string, unknown>;
	profileProps?: Record<string, unknown>;
}

export function NameManagementView({
	mode = "tournament", // Default mode
	userName,
	onStartTournament,

	extensions = {},
	tournamentProps = {},
	profileProps = {},
	className = "",
}: NameManagementViewProps) {
	// * Sync analysis mode with URL
	const [analysisMode, setAnalysisMode] = useState(false);
	const { showToast } = useToast();

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
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
		extensions,
	});

	const { names, isError, dataError, clearErrors } = state;

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
							{typeof extensions.header === "function" ? extensions.header() : extensions.header}
						</div>
					)}
					<section className={styles.dashboardSection}>
						{React.isValidElement(extensions.dashboard)
							? extensions.dashboard
							: typeof extensions.dashboard === "function"
								? React.createElement(extensions.dashboard as React.ComponentType)
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
					handleFilterChange={state.handleFilterChange as (name: string, value: string) => void}
					analysisMode={analysisMode}
					categories={tournamentProps.categories as string[]}
					onStartTournament={handleStartTournament}
					extensions={extensions}
					isAdmin={Boolean(profileProps.isAdmin || tournamentProps.isAdmin)}
					imageList={tournamentProps.imageList as string[]}
					swipeableCards={
						tournamentProps.swipeableCards as React.ComponentType<SwipeableCardsProps>
					}
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
				categories={tournamentProps.categories as string[]} // Profile might use categories
			/>
		);
	};

	return (
		<>
			{isError && (
				<ErrorComponent
					error={dataError?.message || "An error occurred"}
					onRetry={() => state.refetch()}
					onDismiss={clearErrors}
				/>
			)}

			<NameManagementProvider value={state}>
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
