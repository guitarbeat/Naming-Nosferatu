import Button from "@components/Button";
import { NameGrid } from "@components/NameGrid";
import { TournamentToolbar } from "@components/TournamentToolbar";
import React from "react";
import type { NameItem } from "@/types/components";
import { cn } from "@/utils/cn";

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
			{/* Toolbar: View Controls & Filters */}
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

			{/* Main Content Area */}
			<main
				className="w-full max-w-[1600px] mx-auto min-h-[80vh] flex flex-col gap-4 px-4 pb-24"
				data-component="tournament-setup"
				data-mode="tournament"
			>
				{/* Content Container */}
				<div className="flex flex-col gap-4 py-2 w-full items-center justify-center max-w-2xl mx-auto">
					{/* Optional Header Extension */}
					{extensions.header && (
						<header className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
							{typeof extensions.header === "function" ? extensions.header() : extensions.header}
						</header>
					)}

					{/* Quick Actions Bar */}
					{!extensions.nameGrid && (
						<nav
							className="w-full flex justify-end gap-2 mt-2"
							aria-label="Selection actions"
						>
							{(() => {
								if (selectedCount === 0) {
									return (
										<Button
											variant="secondary"
											size="small"
											onClick={() => {
												document
													.querySelector('[data-component="name-grid"]')
													?.scrollIntoView({ behavior: "smooth" });
											}}
											className="font-medium whitespace-nowrap min-w-[120px]"
										>
											Pick Names
										</Button>
									);
								}

								if (selectedCount < 2) {
									return (
										<Button
											variant="secondary"
											size="small"
											onClick={() => setShowSelectedOnly(!showSelectedOnly)}
											className="font-medium whitespace-nowrap min-w-[140px]"
										>
											{showSelectedOnly ? "👁️ Show All" : "👀 Show Selected"}
										</Button>
									);
								}

								return (
									<Button
										variant="primary"
										size="small"
										onClick={() => onStartTournament?.(selectedNames)}
										className={cn(
											"font-bold whitespace-nowrap min-w-[140px]",
											"bg-gradient-to-br from-purple-600 to-purple-800 text-white",
											"hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200",
										)}
									>
										Start ({selectedCount})
									</Button>
								);
							})()}
						</nav>
					)}

					{/* Selection Progress Indicator */}
					{!extensions.nameGrid && (
						<div
							className="w-full my-2 flex flex-col gap-1.5"
							role="progressbar"
							aria-valuenow={selectedCount}
							aria-valuemin={0}
							aria-valuemax={names.length}
							aria-label="Selection progress"
						>
							<div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
								<div
									className="h-full bg-gradient-to-r from-purple-500/80 to-pink-500/80 transition-all duration-500 ease-out"
									style={{
										width: `${Math.max((selectedCount / Math.max(names.length, 1)) * 100, 3)}%`,
									}}
								/>
							</div>
							<p className="text-[11px] text-white/40 font-medium flex justify-between items-center px-0.5">
								<span>
									{selectedCount} / {names.length} selected
								</span>
								{selectedCount < 2 && (
									<span
										className="text-amber-400/70 font-semibold animate-pulse"
										role="status"
										aria-live="polite"
									>
										Need {2 - selectedCount} more
									</span>
								)}
							</p>
						</div>
					)}

					{/* Name Selection Grid */}
					<section
						className="w-full flex-1"
						data-component="name-grid"
						aria-label="Name selection grid"
					>
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
			</main>
		</>
	);
}
