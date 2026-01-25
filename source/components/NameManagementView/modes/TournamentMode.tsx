import { NameGrid } from "@components/NameGrid";
import { cn } from "@utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import type { NameItem } from "@/types/components";
import Button from "../../../shared/components/Button";
import { TournamentToolbar } from "../../../shared/components/TournamentToolbar";

import type { NameManagementViewExtensions, TournamentFilters } from "../nameManagementCore";

export interface SwipeableCardsProps {
	names: NameItem[];
	selectedNames: NameItem[];
	onToggleName: (name: NameItem) => void;
	onRateName: (name: NameItem, rating: number) => void;
	isAdmin: boolean;
	isSelectionMode: boolean;
	showCatPictures: boolean;
	imageList?: string[];
	onStartTournament?: (selectedNames: NameItem[]) => void;
}

interface TournamentModeProps {
	analysisMode: boolean;
	filterConfig: TournamentFilters;
	handleFilterChange: (name: string, value: string) => void;
	totalCount: number;
	filteredCount: number;
	selectedCount: number;
	onStartTournament?: (selectedNames: NameItem[]) => void;

	selectedNames: NameItem[];
	showSelectedOnly: boolean;
	setShowSelectedOnly: (show: boolean) => void;
	names: NameItem[];
	extensions: NameManagementViewExtensions;
	isSwipeMode: boolean;
	showCatPictures: boolean;
	filteredNamesForSwipe: NameItem[];
	toggleName: (name: NameItem) => void;
	isLoading: boolean;
	isAdmin?: boolean;
	imageList?: string[];
	swipeableCards?: React.ComponentType<SwipeableCardsProps>;
}

export function TournamentMode({
	analysisMode,
	filterConfig,
	handleFilterChange,
	totalCount,
	filteredCount,
	selectedCount,
	onStartTournament,

	selectedNames,
	showSelectedOnly,
	setShowSelectedOnly,
	names,
	extensions,
	isSwipeMode,
	showCatPictures,
	filteredNamesForSwipe,
	toggleName,
	isLoading,
	isAdmin,
	imageList,
	swipeableCards,
}: TournamentModeProps) {
	if (analysisMode) {
		return null;
	}

	return (
		<main
			className="w-full max-w-[1600px] mx-auto min-h-[80vh] flex flex-col gap-4 px-4 pb-24"
			data-component="tournament-setup"
		>
			{/* Toolbar */}
			<TournamentToolbar
				mode="tournament"
				filters={filterConfig}
				onFilterChange={handleFilterChange}
				// categories removed
				showUserFilter={false}
				showSelectionFilter={false}
				totalCount={totalCount}
				filteredCount={filteredCount}
			/>

			{/* Optional Header Extension */}
			{extensions.header &&
				(typeof extensions.header === "function" ? extensions.header() : extensions.header)}

			{/* Quick Actions */}
			{!extensions.nameGrid && (
				<nav className="flex justify-end gap-2" aria-label="Selection actions">
					{selectedCount === 0 ? (
						<Button
							variant="secondary"
							size="small"
							onClick={() =>
								document
									.querySelector('[data-component="name-grid"]')
									?.scrollIntoView({ behavior: "smooth" })
							}
							className="font-medium whitespace-nowrap"
						>
							Pick Names
						</Button>
					) : selectedCount < 2 ? (
						<Button
							variant="secondary"
							size="small"
							onClick={() => setShowSelectedOnly(!showSelectedOnly)}
							className="font-medium whitespace-nowrap"
						>
							{showSelectedOnly ? "Show All" : "Show Selected"}
						</Button>
					) : (
						<Button
							variant="primary"
							size="small"
							onClick={() => onStartTournament?.(selectedNames)}
							className={cn(
								"font-bold whitespace-nowrap",
								"bg-gradient-to-br from-purple-600 to-purple-800 text-white",
								"hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200",
							)}
						>
							Start ({selectedCount})
						</Button>
					)}
				</nav>
			)}

			{/* Progress Bar */}
			{!extensions.nameGrid && (
				<div
					className="flex flex-col gap-1"
					role="progressbar"
					aria-valuenow={selectedCount}
					aria-valuemax={names.length}
				>
					<div className="h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
						<div
							className="h-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 transition-all duration-500"
							style={{
								width: `${Math.max((selectedCount / Math.max(names.length, 1)) * 100, 3)}%`,
							}}
						/>
					</div>
					<p className="text-[11px] text-white/40 font-medium flex justify-between px-0.5">
						<span>
							{selectedCount} / {names.length} selected
						</span>
						{selectedCount < 2 && (
							<span className="text-amber-400/70 font-semibold animate-pulse">
								Need {2 - selectedCount} more
							</span>
						)}
					</p>
				</div>
			)}

			{/* Name Grid */}
			<section
				className="flex-1 relative min-h-[500px]"
				data-component="name-grid"
				aria-label="Name selection"
			>
				<AnimatePresence mode="wait">
					{extensions.nameGrid ? (
						<motion.div
							key="extension-grid"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
							className="w-full h-full"
						>
							{extensions.nameGrid}
						</motion.div>
					) : isSwipeMode && swipeableCards && !isLoading ? (
						<motion.div
							key="swipe-mode"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.3 }}
							className="w-full h-full"
						>
							{React.createElement(swipeableCards, {
								names: filteredNamesForSwipe,
								selectedNames,
								onToggleName: toggleName,
								onRateName: (name: NameItem, rating: number) => console.log("Rate", name, rating),
								isAdmin: !!isAdmin,
								isSelectionMode: false,
								showCatPictures,
								imageList,
								onStartTournament,
							})}
						</motion.div>
					) : (
						<motion.div
							key="grid-mode"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.3 }}
							className="w-full h-full"
						>
							<NameGrid
								names={names}
								selectedNames={selectedNames}
								onToggleName={toggleName}
								filters={filterConfig}
								isAdmin={isAdmin}
								showSelectedOnly={showSelectedOnly}
								showCatPictures={showCatPictures}
								imageList={imageList}
								isLoading={isLoading}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</section>
		</main>
	);
}
