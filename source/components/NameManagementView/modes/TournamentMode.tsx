import Button from "@components/Button";
import { NameGrid } from "@components/NameGrid";
import { TournamentToolbar } from "@components/TournamentToolbar";
import React from "react";
import type { NameItem } from "@/types/components";

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
	categories?: string[];
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
	categories,
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
		<>
			{/* Tournament Page Title & Global Actions */}
			<TournamentToolbar
				mode="tournament"
				filters={filterConfig}
				onFilterChange={handleFilterChange}
				categories={categories || []}
				showUserFilter={false}
				showSelectionFilter={false}
				totalCount={totalCount}
				filteredCount={filteredCount}
			/>

			<div className="w-full max-w-[1600px] mx-auto min-h-[80vh] flex flex-col gap-6 px-4 pb-20" data-mode="tournament">
				{/* Header Extension */}
				{extensions.header && (
					<div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
						{typeof extensions.header === "function" ? extensions.header() : extensions.header}
					</div>
				)}

				{/* Header Actions (Show Selected Toggle) */}
				{!extensions.nameGrid && (
					<nav className="w-full flex justify-end gap-2 my-2">
						{selectedCount > 0 && (
							<Button
								variant={showSelectedOnly ? "primary" : "secondary"}
								size="small"
								onClick={() => setShowSelectedOnly(!showSelectedOnly)}
								className="font-medium whitespace-nowrap min-w-[140px]"
							>
								{showSelectedOnly ? "👁️ Show All Names" : "👀 Show Selected Only"}
							</Button>
						)}
					</nav>
				)}

				{/* Progress Bar */}
				{!extensions.nameGrid && (
					<div
						className="w-full my-4 flex flex-col gap-2"
						role="progressbar"
						aria-valuenow={selectedCount}
						aria-valuemin={0}
						aria-valuemax={names.length}
						aria-label="Selection Progress"
					>
						<div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
							<div
								className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.4)]"
								style={{
									width: `${Math.max((selectedCount / Math.max(names.length, 1)) * 100, 5)}%`,
								}}
							/>
						</div>
						<span className="text-sm text-white/60 font-medium flex justify-between items-center px-1">
							<span>
								{selectedCount} of {names.length} names selected
							</span>
							{selectedCount < 2 && (
								<span className="text-yellow-400 font-bold ml-1 animate-pulse" role="status" aria-live="polite">
									(Need {2 - selectedCount} more to start tournament)
								</span>
							)}
						</span>
					</div>
				)}

				{/* Name Grid */}
				<section className="w-full flex-1">
					{extensions.nameGrid ? (
						extensions.nameGrid
					) : isSwipeMode && swipeableCards && !isLoading ? (
						React.createElement(swipeableCards, {
							names: filteredNamesForSwipe,
							selectedNames: selectedNames,
							onToggleName: toggleName,
							onRateName: (name: NameItem, rating: number) => {
								console.log("Rate", name, rating);
							},
							isAdmin: !!isAdmin,
							isSelectionMode: false,
							showCatPictures: showCatPictures,
							imageList: imageList,
							onStartTournament: onStartTournament,
						})
					) : (
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
					)}
				</section>
			</div>
		</>
	);
}
