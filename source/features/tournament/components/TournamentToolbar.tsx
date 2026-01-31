/**
 * @module TournamentToolbar
 * @description Toolbar for filtering and sorting tournament names.
 * Recreated to fix missing import error.
 */

import React from "react";
import Button from "@/layout/Button";
import { Input, Select } from "@/layout/FormPrimitives";
import type { TournamentFilters } from "@/types/appTypes";
import { cn } from "@/utils/basic";

interface TournamentToolbarProps {
	mode?: "profile" | "tournament";
	filters: TournamentFilters;
	onFilterChange?: (name: keyof TournamentFilters, value: string | number | boolean) => void;
	showUserFilter?: boolean;
	showSelectionFilter?: boolean;
	userOptions?: { value: string; label: string }[];
	className?: string;
}

export function TournamentToolbar({
	mode = "tournament",
	filters,
	onFilterChange,
	showUserFilter = false,
	showSelectionFilter = false,
	userOptions = [],
	className,
}: TournamentToolbarProps) {
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onFilterChange?.("searchTerm", e.target.value);
	};

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onFilterChange?.("sortBy", e.target.value);
	};

	const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onFilterChange?.("userFilter", e.target.value);
	};

	// Logic to toggle sort direction could be added here if needed,
	// but for now we'll rely on the default sort direction provided by the parent or defaults.

	return (
		<div
			className={cn(
				"flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm",
				className,
			)}
		>
			{/* Search */}
			<div className="w-full md:w-auto md:flex-1 md:max-w-xs">
				<Input
					placeholder="Search names..."
					value={filters.searchTerm || ""}
					onChange={handleSearchChange}
					className="bg-black/20 border-white/10 focus:border-purple-500/50"
				/>
			</div>

			{/* Filters Group */}
			<div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
				{/* Sort By */}
				<div className="w-full sm:w-auto min-w-[140px]">
					<Select
						value={filters.sortBy || "rating"}
						onChange={handleSortChange}
						options={[
							{ value: "rating", label: "Rating" },
							{ value: "name", label: "Name" },
							{ value: "wins", label: "Wins" },
							{ value: "matches", label: "Matches" },
							...(mode === "profile" ? [{ value: "date", label: "Date Added" }] : []),
						]}
						className="bg-black/20 border-white/10"
					/>
				</div>

				{/* User Filter (if enabled) */}
				{showUserFilter && userOptions.length > 0 && (
					<div className="w-full sm:w-auto min-w-[140px]">
						<Select
							value={filters.userFilter || "all"}
							onChange={handleUserChange}
							options={[{ value: "all", label: "All Users" }, ...userOptions]}
							className="bg-black/20 border-white/10"
						/>
					</div>
				)}

				{/* Selection Filter (if enabled) */}
				{showSelectionFilter && (
					<div className="flex items-center gap-2">
						{/* Could be a toggle or specific filter logic */}
						{/* Placeholder for now */}
					</div>
				)}

				{/* Sort Direction Toggle - Optional, can just be part of Sort By logic or separate button */}
				{onFilterChange && (
					<Button
						variant="secondary"
						size="medium"
						iconOnly={true}
						onClick={() =>
							onFilterChange("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc")
						}
						aria-label="Toggle sort order"
						className="min-w-[40px] px-0"
					>
						<span className="material-symbols-outlined">
							{filters.sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
						</span>
					</Button>
				)}
			</div>
		</div>
	);
}
