import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useCallback } from "react";
import useAppStore from "@/store/appStore";
import type { NameManagementViewExtensions, UseNameManagementViewResult } from "@/appTypes";
import { Layers, LayoutGrid } from "@/icons";
import Button from "@/layout/Button";
import { CardStats } from "@/layout/Card";
import { EmptyState } from "@/layout/EmptyState";
import { NameGrid } from "../components/NameGrid";
import { ProfileSection } from "../components/ProfileSection";
import { SwipeableCards } from "../components/SwipeableCards";

interface ManagementModeProps extends UseNameManagementViewResult {
	mode: "tournament" | "profile";
}

/**
 * ManagementMode Component
 * Consolidated view for both Tournament Setup and Profile/History management.
 * Replaces ProfileMode.tsx and TournamentMode.tsx
 */
export const ManagementMode = memo<ManagementModeProps>(
	({
		mode,
		names,
		filteredNames,
		isLoading,
		isError,
		error,
		refetch,
		clearErrors,
		toggleName,
		selectedNames,
		selectedCount,
		stats,
		filterStatus,
		setFilterStatus,
		selectionFilter,
		setSelectionFilter,
		searchTerm,
		setSearchTerm,
		setShowSelectedOnly,
		showSelectedOnly,
		handleFilterChange,
		handleAnalysisModeToggle,
		analysisMode,
		showCatPictures,
		tournamentProps = {},
		profileProps = {},
		setNames,
		extensions = {} as NameManagementViewExtensions,
	}: ManagementModeProps): React.ReactElement => {
		const isTournament = mode === "tournament";

		// Get swipe mode state from global store
		const isSwipeMode = useAppStore((state) => state.ui.isSwipeMode);
		const setSwipeMode = useAppStore((state) => state.uiActions.setSwipeMode);
		const showCatPicturesGlobal = useAppStore((state) => state.ui.showCatPictures);
		const setCatPictures = useAppStore((state) => state.uiActions.setCatPictures);

		// Direct mode setters instead of toggle
		const setGridMode = useCallback(() => {
			if (isSwipeMode) {
				setSwipeMode(false);
			}
		}, [isSwipeMode, setSwipeMode]);

		const setSwipeModeActive = useCallback(() => {
			if (!isSwipeMode) {
				setSwipeMode(true);
			}
		}, [isSwipeMode, setSwipeMode]);

		// Get handlers from tournamentProps
		const onStartTournament = (tournamentProps?.onStartTournament ?? tournamentProps?.onStart) as
			| ((names: typeof selectedNames) => void)
			| undefined;

		// Determine if we should show the progress bar (only in tournament setup with enough names)
		const showProgress = Boolean(isTournament && tournamentProps.showProgress && names.length > 0);
		const targetSize = (tournamentProps.targetSize as number) || 16;

		if (isError) {
			return (
				<EmptyState
					title="Error Loading Names"
					description={error?.message || "Please try again later"}
					icon="⚠️"
					action={
						<Button
							variant="danger"
							onClick={() => {
								clearErrors();
								refetch();
							}}
						>
							Retry
						</Button>
					}
				/>
			);
		}

		return (
			<main
				className="w-full max-w-[95%] mx-auto min-h-[80vh] flex flex-col gap-8 px-4 pb-24"
				data-component="management-mode"
			>
				{/* Profile Section (Only in Profile Mode) */}
				{!isTournament && (
					<ProfileSection
						onLogin={
							(profileProps.onLogin as (name: string) => Promise<boolean | undefined>) ||
							(profileProps.onUpdate as (name: string) => Promise<boolean | undefined>) ||
							(async (): Promise<boolean> => Promise.resolve(true))
						}
					/>
				)}

				<div className="flex flex-col gap-6">
					{/* View Mode Toggle - Sticky header for tournament mode */}
					{isTournament && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className="sticky top-0 z-20 flex flex-col gap-4 px-4 py-3 -mx-4 bg-black/90 backdrop-blur-xl border-b border-white/10"
						>
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-2">
									<button
										type="button"
										onClick={setGridMode}
										className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
											isSwipeMode
												? "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
												: "bg-purple-500/30 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
										}`}
									>
										<LayoutGrid size={16} />
										Grid
									</button>
									<button
										type="button"
										onClick={setSwipeModeActive}
										className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
											isSwipeMode
												? "bg-purple-500/30 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10"
												: "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
										}`}
									>
										<Layers size={16} />
										Swipe
									</button>
								</div>
								<span className="text-xs text-white/50 font-medium">{selectedCount} selected</span>
							</div>
							<div className="tournament-toolbar-filters-container">
								<div className="tournament-toolbar-filters-grid">
									<div className="tournament-toolbar-search-wrapper">
										<span className="tournament-toolbar-search-icon">🔍</span>
										<input
											type="search"
											placeholder="Search names"
											value={searchTerm}
											onChange={(event) => setSearchTerm(event.target.value)}
											className="tournament-toolbar-search-input analysis-input"
											aria-label="Search names"
										/>
									</div>
									<div className="tournament-toolbar-filter-group">
										<span className="tournament-toolbar-filter-label">Visibility</span>
										<select
											value={filterStatus}
											onChange={(event) => setFilterStatus(event.target.value)}
											className="tournament-toolbar-filter-select"
											disabled={!analysisMode}
										>
											<option value="visible">Visible</option>
											<option value="hidden">Hidden</option>
											<option value="all">All</option>
										</select>
									</div>
									<div className="tournament-toolbar-filter-group">
										<span className="tournament-toolbar-filter-label">Selection</span>
										<select
											value={selectionFilter}
											onChange={(event) =>
												setSelectionFilter(event.target.value as "all" | "selected" | "unselected")
											}
											className="tournament-toolbar-filter-select"
										>
											<option value="all">All</option>
											<option value="selected">Selected</option>
											<option value="unselected">Unselected</option>
										</select>
									</div>
									<div className="toolbar-segmented">
										<button
											type="button"
											onClick={() => setShowSelectedOnly(!showSelectedOnly)}
											className={`toolbar-toggle ${showSelectedOnly ? "toolbar-toggle--active" : ""}`}
										>
											{showSelectedOnly ? "Showing Selected" : "Show Selected"}
										</button>
										<div className="toolbar-divider" />
										<button
											type="button"
											onClick={() => setCatPictures(!showCatPicturesGlobal)}
											className={`toolbar-toggle ${showCatPicturesGlobal ? "toolbar-toggle--active" : ""}`}
										>
											{showCatPicturesGlobal ? "Cats On" : "Cats Off"}
										</button>
										<div className="toolbar-divider" />
										<button
											type="button"
											onClick={handleAnalysisModeToggle}
											className={`toolbar-toggle toolbar-toggle--accent ${analysisMode ? "toolbar-toggle--active" : ""}`}
										>
											{analysisMode ? "Exit Analysis" : "Enter Analysis"}
										</button>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{isTournament && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<CardStats
								label="Total"
								value={stats.total}
								emoji="📇"
								variant="primary"
								className="min-h-[110px]"
							/>
							<CardStats
								label="Visible"
								value={stats.visible}
								emoji="👀"
								variant="info"
								className="min-h-[110px]"
							/>
							<CardStats
								label="Hidden"
								value={stats.hidden}
								emoji="🕵️"
								variant="warning"
								className="min-h-[110px]"
							/>
							<CardStats
								label="Selected"
								value={stats.selected}
								emoji="✅"
								variant="success"
								className="min-h-[110px]"
							/>
						</div>
					)}

					{showProgress && (
						<div
							className="flex flex-col gap-1 px-1 animate-in fade-in slide-in-from-left-4 duration-700"
							role="progressbar"
							aria-valuenow={selectedCount}
							aria-valuemax={targetSize}
						>
							<div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
								<div
									className="h-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 transition-all duration-500"
									style={{
										width: `${Math.max((selectedCount / targetSize) * 100, 3)}%`,
									}}
								/>
							</div>
							<p className="text-[11px] text-white/40 font-medium flex justify-between px-0.5">
								<span>
									{selectedCount} / {targetSize} names selected for tournament
								</span>
								{selectedCount < 2 && (
									<span className="text-amber-400/70 font-semibold animate-pulse">
										Need {2 - selectedCount} more
									</span>
								)}
							</p>
						</div>
					)}

					{/* Main Content Area - Grid or Swipe */}
					<AnimatePresence mode="wait">
						{filteredNames.length === 0 && !isLoading ? (
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								className="py-20"
							>
								<EmptyState
									title="No Names Found"
									description="No names available for this criteria. Try clearing filters or adding some names!"
									icon="search_off"
									action={
										<Button
											variant="secondary"
											onClick={() => {
												handleFilterChange("filterStatus", "visible");
											}}
										>
											Reset Filters
										</Button>
									}
								/>
							</motion.div>
						) : isSwipeMode && isTournament && onStartTournament ? (
							/* Swipeable Cards Mode */
							<motion.div
								key="swipe-view"
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.98 }}
								className="flex-1 relative min-h-[500px]"
							>
								<SwipeableCards
									names={filteredNames}
									selectedNames={selectedNames}
									onToggleName={toggleName}
									showCatPictures={showCatPicturesGlobal}
									imageList={(tournamentProps.imageList as string[]) || []}
									onStartTournament={onStartTournament}
								/>
							</motion.div>
						) : (
							/* Grid Mode */
							<motion.div
								key="grid-view"
								initial={{ opacity: 0, scale: 0.98 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.98 }}
								className="flex-1 relative min-h-[500px]"
							>
								<NameGrid
									names={filteredNames}
									selectedNames={selectedNames}
									onToggleName={toggleName}
									isLoading={isLoading}
									isAdmin={Boolean(profileProps.isAdmin)}
									showCatPictures={showCatPictures}
									imageList={tournamentProps.imageList as string[]}
									onNamesUpdate={setNames}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* Custom Extensions (e.g., Bulk Actions, Navigation) */}
				{extensions.bulkActions && (
					<div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in duration-700">
						{React.isValidElement(extensions.bulkActions)
							? extensions.bulkActions
							: typeof extensions.bulkActions === "function"
								? React.createElement(extensions.bulkActions)
								: null}
					</div>
				)}
			</main>
		);
	},
);

ManagementMode.displayName = "ManagementMode";
/**
 * @module NameManagementView
 * @description Shared view component that powers both Tournament Setup and Profile views.
 * Provides a consistent interface with mode-specific extensions.
 */

import React, { useEffect, useState } from "react";
import type {
	NameItem,
	NameManagementViewExtensions,
	UseNameManagementViewProps,
} from "@/appTypes";
import { NameManagementProvider } from "@/features/tournament/context/NameManagementContext";
import { useNameManagementView } from "@/features/tournament/hooks/useNameManagementView";
import { ErrorComponent } from "@/layout/FeedbackComponents";
import { useToast } from "@/Providers";
import { cn } from "@/utils/basic";
import { ManagementMode } from "./ManagementMode";

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
	analysisMode: propsAnalysisMode,
	setAnalysisMode: propsSetAnalysisMode,

	extensions = {},
	tournamentProps = {},
	profileProps = {},
	className = "",
}: NameManagementViewProps) {
	// * Internal state as fallback if not provided by props (though required in interface)
	const [internalAnalysisMode, setInternalAnalysisMode] = useState(false);

	const analysisMode = propsAnalysisMode ?? internalAnalysisMode;
	const setAnalysisMode = propsSetAnalysisMode ?? setInternalAnalysisMode;

	const { showToast } = useToast();

	useEffect(() => {
		if (typeof window === "undefined" || propsAnalysisMode !== undefined) {
			return;
		}
		const params = new URLSearchParams(window.location.search);
		setInternalAnalysisMode(params.get("analysis") === "true");
	}, [propsAnalysisMode]);

	const state = useNameManagementView({
		mode,
		userName,
		profileProps,
		tournamentProps,
		analysisMode,
		setAnalysisMode,
		extensions,
	});

	const { isError, dataError, clearErrors } = state;

	// * Feedback Side Effects
	useEffect(() => {
		if (isError && dataError) {
			showToast(dataError.message || "An error occurred while loading data", "error");
		}
	}, [isError, dataError, showToast]);

	const renderContent = () => {
		// 1. Dashboard Mode (Analysis or Profile Dashboard via extension)
		if (analysisMode && extensions.dashboard) {
			return (
				<div
					className={cn(
						"w-full max-w-[95%] mx-auto min-h-[80vh] flex flex-col gap-8 px-4 md:px-8 bg-black/50 backdrop-blur-sm rounded-3xl border border-white/5",
						className,
					)}
					data-component="name-management-view"
					data-mode="analysis"
				>
					{extensions.header && (
						<div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
							{typeof extensions.header === "function" ? extensions.header() : extensions.header}
						</div>
					)}
					<section className="w-full flex-1 min-h-[500px] animate-in fade-in zoom-in-95 duration-500 delay-100">
						{React.isValidElement(extensions.dashboard)
							? extensions.dashboard
							: typeof extensions.dashboard === "function"
								? React.createElement(extensions.dashboard as React.ComponentType)
								: extensions.dashboard}
					</section>
				</div>
			);
		}

		// 2. Management Mode (Tournament Setup or Profile Grid)
		return <ManagementMode {...state} mode={mode} />;
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
import { AnimatePresence, motion } from "framer-motion";
import useAppStore from "@/store/appStore";
import TournamentPlay from "@/features/tournament/modes/TournamentPlay";
import Button from "@/layout/Button";
import { Card, type GlassConfig } from "@/layout/Card";
import { getGlassPreset } from "@/layout/GlassPresets";
import { Section } from "@/layout/Section";
import { NameSuggestion } from "../components/NameSuggestion";
import { useTournamentHandlers } from "../hooks/useTournamentHandlers";
import TournamentSetup from "./TournamentSetup";

export default function TournamentFlow() {
	const { user, tournament, tournamentActions } = useAppStore();

	const { handleTournamentComplete, handleStartNewTournament, handleTournamentSetup } =
		useTournamentHandlers({
			userName: user.name,
			tournamentActions,
		});

	return (
		<div className="w-full flex flex-col gap-8">
			{/* Main Tournament Flow Area - Swaps between Setup and Play */}
			<Section
				id="tournament-area"
				variant="minimal"
				padding="compact"
				maxWidth="full"
				scrollMargin={false}
			>
				<AnimatePresence mode="wait">
					{tournament.isComplete && tournament.names !== null ? (
						<motion.div
							key="complete"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className="w-full flex justify-center py-10"
						>
							<Card
								liquidGlass={{ ...getGlassPreset("card") } as GlassConfig}
								padding="xl"
								shadow="xl"
								enableTilt={true}
								className="text-center max-w-2xl"
							>
								<h2 className="text-4xl font-bold mb-6 gradient-text uppercase tracking-tighter">
									A victor emerges from the eternal tournament
								</h2>
								<div className="flex justify-center mb-8">
									<div className="text-6xl p-6 bg-purple-500/10 rounded-full border border-purple-500/20">
										🏆
									</div>
								</div>
								<p className="text-lg text-slate-300 mb-10">
									Your personal rankings have been updated. Head over to the{" "}
									<strong className="text-purple-400">Analyze</strong> section to see the full
									breakdown and compare results!
								</p>
								<div className="flex gap-4 justify-center">
									<Button
										onClick={() =>
											document.getElementById("analysis")?.scrollIntoView({ behavior: "smooth" })
										}
										variant="primary"
									>
										Analyze Results
									</Button>
									<Button onClick={handleStartNewTournament} variant="secondary">
										Start New Tournament
									</Button>
								</div>
							</Card>
						</motion.div>
					) : tournament.names !== null ? (
						/* PLAY MODE */
						<motion.div
							key="tournament"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							className="w-full"
						>
							<TournamentPlay
								names={tournament.names}
								existingRatings={tournament.ratings}
								onComplete={handleTournamentComplete}
								userName={user.name}
								onVote={tournamentActions.addVote}
							/>
						</motion.div>
					) : (
						/* SETUP MODE */
						<motion.div
							key="setup"
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 20 }}
							className="w-full"
						>
							<TournamentSetup
								onStart={(setupData) => {
									handleTournamentSetup(setupData);
									// Seamless transition - no scroll needed
								}}
								userName={user.name}
								isLoggedIn={user.isLoggedIn}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</Section>

			{/* Suggest Name Section - Hidden during active tournament play */}
			{(tournament.names === null || tournament.isComplete) && (
				<Section
					id="suggest"
					variant="minimal"
					padding="comfortable"
					maxWidth="xl"
					separator={true}
					scrollMargin={false}
					compact={true}
				>
					<h2 className="text-2xl font-bold mb-8 text-center text-slate-400">Suggest a Name</h2>
					<NameSuggestion />
				</Section>
			)}
		</div>
	);
}
import { memo } from "react";
import useAppStore from "@/store/appStore";
import type { TournamentProps } from "@/appTypes";
import { Card } from "@/layout/Card";
import { ErrorComponent, Loading } from "@/layout/FeedbackComponents";
import { useToast } from "@/Providers";
import { CAT_IMAGES, getRandomCatImage } from "@/services/tournament";
import { getVisibleNames } from "@/utils/basic";
import { useAudioManager } from "../hooks/useAudioManager";
import { useTournamentState } from "../hooks/useTournamentState";
import { useTournamentVote } from "../hooks/useTournamentVote";

function TournamentPlayContent({
	onComplete,
	existingRatings = {},
	names = [],
	onVote,
}: TournamentProps) {
	const { showSuccess, showError } = useToast();
	const visibleNames = getVisibleNames(names);
	const audioManager = useAudioManager();

	const {
		setSelectedOption,
		isTransitioning,
		setIsTransitioning,
		isProcessing,
		setIsProcessing,
		setLastMatchResult,
		setShowMatchResult,
		setVotingError,
		handleVote,
		tournament,
	} = useTournamentState(visibleNames, existingRatings, onComplete, onVote);

	const { currentMatch, progress, roundNumber, currentMatchNumber, totalMatches, handleUndo } =
		tournament;

	const { handleVoteWithAnimation } = useTournamentVote({
		isProcessing,
		isTransitioning,
		currentMatch,
		handleVote,
		onVote,
		audioManager,
		setIsProcessing,
		setIsTransitioning,
		setSelectedOption,
		setVotingError,
		setLastMatchResult,
		setShowMatchResult,
		showSuccess,
		showError,
	});

	const showCatPictures = useAppStore((state) => state.ui.showCatPictures);
	const setCatPictures = useAppStore((state) => state.uiActions.setCatPictures);

	if (!currentMatch) {
		return (
			<div className="flex items-center justify-center min-h-[500px]">
				<Loading variant="spinner" />
			</div>
		);
	}

	const leftImg = showCatPictures
		? getRandomCatImage(
				typeof currentMatch.left === "object" ? currentMatch.left.id : currentMatch.left,
				CAT_IMAGES,
			)
		: null;
	const rightImg = showCatPictures
		? getRandomCatImage(
				typeof currentMatch.right === "object" ? currentMatch.right.id : currentMatch.right,
				CAT_IMAGES,
			)
		: null;

	return (
		<div className="relative min-h-screen w-full flex flex-col overflow-hidden max-w-[430px] mx-auto border-x border-white/5 font-display text-white selection:bg-primary/30">
			{/* Header */}
			<header className="pt-6 px-4 space-y-4">
				<div className="flex items-center justify-between">
					<div className="px-4 py-1.5 rounded-full flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20">
						<span className="material-symbols-outlined text-primary text-sm">stars</span>
						<span className="text-xs font-bold tracking-widest uppercase text-white/90">
							Round {roundNumber}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="material-symbols-outlined text-stardust">workspace_premium</span>
						<span className="text-xs font-bold">{progress}</span>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
						<div
							className="h-full bg-primary rounded-full shadow-[0_0_10px_#a65eed]"
							style={{ width: `${(currentMatchNumber / totalMatches) * 100}%` }}
						/>
					</div>
				</div>
			</header>

			{/* Controls */}
			<section className="mt-6 px-4">
				<Card
					className="flex flex-row items-center justify-between"
					padding="small"
					variant="default"
				>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={audioManager.handleToggleMute}
							className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
							aria-label={audioManager.isMuted ? "Unmute audio" : "Mute audio"}
							aria-pressed={!audioManager.isMuted}
							title={audioManager.isMuted ? "Unmute audio" : "Mute audio"}
						>
							<span className="material-symbols-outlined">
								{audioManager.isMuted ? "volume_off" : "volume_up"}
							</span>
						</button>
					</div>
					<button
						type="button"
						onClick={() => setCatPictures(!showCatPictures)}
						className={`flex items-center gap-2 px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg ${showCatPictures ? "bg-primary shadow-primary/20" : "bg-white/10"}`}
						aria-pressed={showCatPictures}
						title={showCatPictures ? "Hide cat pictures" : "Show cat pictures"}
					>
						<span className="material-symbols-outlined text-sm">pets</span>
						<span>{showCatPictures ? "Names Only" : "Show Cats"}</span>
					</button>
				</Card>
			</section>

			{/* Battle Area */}
			<main className="flex-1 flex flex-col items-center justify-center px-4 relative my-4">
				<div className="relative grid grid-cols-2 gap-4 w-full h-full max-h-[500px]">
					{/* Left */}
					<Card
						interactive={true}
						onClick={() => handleVoteWithAnimation("left")}
						className="flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer h-full"
						variant="default"
					>
						<div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 flex items-center justify-center">
							{leftImg ? (
								<div
									className="w-full h-full bg-cover bg-center"
									style={{ backgroundImage: `url('${leftImg}')` }}
								/>
							) : (
								<span className="text-white/20 text-6xl font-bold select-none">
									{typeof currentMatch.left === "object" && currentMatch.left?.name
										? currentMatch.left.name[0]?.toUpperCase() || "?"
										: "?"}
								</span>
							)}
						</div>
						<div className="text-center pb-4 z-10 w-full">
							<h3 className="font-whimsical text-2xl text-white tracking-wide break-words w-full">
								{typeof currentMatch.left === "object"
									? currentMatch.left?.name
									: currentMatch.left}
							</h3>
						</div>
					</Card>

					{/* VS */}
					<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
						<div className="size-14 rounded-full flex items-center justify-center border-2 border-white/30 bg-primary/20 backdrop-blur-md shadow-lg">
							<span className="font-bold text-xl italic tracking-tighter">VS</span>
						</div>
					</div>

					{/* Right */}
					<Card
						interactive={true}
						onClick={() => handleVoteWithAnimation("right")}
						className="flex flex-col items-center justify-between relative overflow-hidden group cursor-pointer h-full"
						variant="default"
					>
						<div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-white/10 flex items-center justify-center">
							{rightImg ? (
								<div
									className="w-full h-full bg-cover bg-center"
									style={{ backgroundImage: `url('${rightImg}')` }}
								/>
							) : (
								<span className="text-white/20 text-6xl font-bold select-none">
									{typeof currentMatch.right === "object" && currentMatch.right?.name
										? currentMatch.right.name[0]?.toUpperCase() || "?"
										: "?"}
								</span>
							)}
						</div>
						<div className="text-center pb-4 z-10 w-full">
							<h3 className="font-whimsical text-2xl text-white tracking-wide break-words w-full">
								{typeof currentMatch.right === "object"
									? currentMatch.right?.name
									: currentMatch.right}
							</h3>
						</div>
					</Card>
				</div>

				{/* Undo */}
				<button
					type="button"
					onClick={handleUndo}
					className="mt-6 glass-panel py-2 px-6 rounded-full flex items-center gap-3 border border-primary/20 cursor-pointer hover:bg-white/5 transition-colors"
				>
					<span className="material-symbols-outlined text-sm text-primary">undo</span>
					<span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">
						Undo
					</span>
				</button>
			</main>

			{/* Background */}
			<div className="absolute top-[-10%] left-[-10%] size-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
			<div className="absolute bottom-[-10%] right-[-10%] size-64 bg-stardust/10 rounded-full blur-[100px] -z-10" />
		</div>
	);
}

const MemoizedTournamentPlay = memo(TournamentPlayContent);

export default function TournamentPlay(props: TournamentProps) {
	return (
		<ErrorComponent variant="boundary">
			<MemoizedTournamentPlay {...props} />
		</ErrorComponent>
	);
}
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import useAppStore from "@/store/appStore";
import type { NameItem } from "@/appTypes";
import { CAT_IMAGES } from "@/constants";
import { fetchCatAvatars } from "@/utils/basic";
import { SwipeableCards } from "../components/SwipeableCards";
import { NameManagementView } from "./NameManagementView";

interface TournamentSetupProps {
	onStart: (selectedNames: NameItem[]) => void;
	userName?: string;
	isLoggedIn: boolean;
	onNameChange?: (names: NameItem[]) => void;
}

export default function TournamentSetup({
	onStart,
	userName = "",
	isLoggedIn,
}: TournamentSetupProps) {
	const [analysisMode, setAnalysisMode] = useState(false);

	const { user, userActions } = useAppStore();

	useEffect(() => {
		if (isLoggedIn && !user.avatarUrl) {
			fetchCatAvatars(1).then((avatars) => {
				if (avatars[0]) {
					userActions.setAvatar(avatars[0]);
				}
			});
		}
	}, [isLoggedIn, user.avatarUrl, userActions]);
	return (
		<AnimatePresence mode="wait">
			<motion.div
				key="setup"
				className="w-full flex-1"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
			>
				<NameManagementView
					mode="tournament"
					userName={userName}
					analysisMode={analysisMode}
					setAnalysisMode={setAnalysisMode}
					tournamentProps={{
						swipeableCards: SwipeableCards,
						imageList: CAT_IMAGES,
						onStartTournament: onStart,
					}}
					onStartTournament={onStart}
				/>
			</motion.div>
		</AnimatePresence>
	);
}
