import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useCallback } from "react";
import { Layers, LayoutGrid } from "@/icons";
import Button from "@/layout/Button";
import { EmptyState } from "@/layout/EmptyState";
import useAppStore from "@/store/appStore";
import type { NameManagementViewExtensions, UseNameManagementViewResult } from "@/types/appTypes";
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
		handleFilterChange,
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
				<div className="flex flex-col items-center justify-center p-12 text-center bg-red-500/5 rounded-2xl border border-red-500/20 backdrop-blur-md">
					<h3 className="text-xl font-bold text-red-500 mb-2">Error Loading Names</h3>
					<p className="text-white/60 mb-6">{error?.message || "Please try again later"}</p>
					<button
						type="button"
						onClick={() => {
							clearErrors();
							refetch();
						}}
						className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
					>
						Retry
					</button>
				</div>
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
						className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 py-3 -mx-4 bg-black/90 backdrop-blur-xl border-b border-white/10"
					>
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
					</motion.div>
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
