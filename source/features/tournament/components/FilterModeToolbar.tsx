import React from "react";
import { FILTER_OPTIONS } from "@/constants";
import { Select } from "@/layout/FormPrimitives";
import type { TournamentFilters } from "@/types";
import {
	FilterSelect,
	type SelectOption,
	SortOrderIcon,
	styles,
} from "./TournamentToolbarComponents";

export const FILTER_CONFIGS = {
	visibility: [
		{ value: "all", label: "All Names" },
		{ value: "visible", label: "Visible Only" },
		{ value: "hidden", label: "Hidden Only" },
	],
	users: [
		{ value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
		{ value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
		{ value: FILTER_OPTIONS.USER.OTHER, label: "Other Users" },
	],
	sort: [
		{ value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
		{ value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
		{ value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
		{ value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
		{ value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
		{ value: FILTER_OPTIONS.SORT.CREATED, label: "Created" },
	],
	selection: [
		{ value: "all", label: "All Names" },
		{ value: "selected", label: "Ever Selected" },
		{ value: "never_selected", label: "Never Selected" },
		{ value: "frequently_selected", label: "Frequently Selected" },
		{ value: "recently_selected", label: "Recently Selected" },
	],
	date: [
		{ value: "all", label: "All Dates" },
		{ value: "today", label: "Today" },
		{ value: "week", label: "This Week" },
		{ value: "month", label: "This Month" },
		{ value: "year", label: "This Year" },
	],
};

interface FilterModeToolbarProps {
	filters: TournamentFilters;
	onFilterChange?: (name: string, value: string) => void;
	showUserFilter: boolean;
	userOptions?: SelectOption[] | null;
	showSelectionFilter: boolean;
	analysisMode: boolean;
	isHybrid: boolean;
	showFilters: boolean;
}

export function FilterModeToolbar({
	filters,
	onFilterChange,
	showUserFilter,
	userOptions = null,
	showSelectionFilter,
	analysisMode,
	showFilters,
}: FilterModeToolbarProps) {
	const isAsc = filters.sortOrder === FILTER_OPTIONS.ORDER.ASC;

	if (!showFilters) {
		return null;
	}

	return (
		<div className={styles.filtersContainer}>
			<div className={styles.filtersGrid}>
				<FilterSelect
					id="filter-status"
					label="Status"
					value={(filters.filterStatus as string) || FILTER_OPTIONS.VISIBILITY.VISIBLE}
					options={FILTER_CONFIGS.visibility}
					onChange={(value) =>
						onFilterChange?.(
							"filterStatus",
							(value === "active"
								? FILTER_OPTIONS.VISIBILITY.VISIBLE
								: value || FILTER_OPTIONS.VISIBILITY.VISIBLE) as string,
						)
					}
				/>
				{showUserFilter && (
					<FilterSelect
						id="filter-user"
						label="User"
						value={(filters.userFilter as string) || FILTER_OPTIONS.USER.ALL}
						options={userOptions || FILTER_CONFIGS.users}
						onChange={(value) => onFilterChange?.("userFilter", value as string)}
					/>
				)}
				{showSelectionFilter && (
					<FilterSelect
						id="filter-selection"
						label="Selection"
						value={(filters.selectionFilter as string) || "all"}
						options={FILTER_CONFIGS.selection}
						onChange={(value) => onFilterChange?.("selectionFilter", value as string)}
					/>
				)}
				{analysisMode && (
					<FilterSelect
						id="filter-date"
						label="Date"
						value={(filters.dateFilter as string) || "all"}
						options={FILTER_CONFIGS.date}
						onChange={(value) => onFilterChange?.("dateFilter", value as string)}
					/>
				)}

				<div className={styles.sortGroup}>
					<label htmlFor="filter-sort" className={styles.filterLabel}>
						Sort By
					</label>
					<div className={styles.sortControls}>
						<Select
							name="filter-sort"
							value={
								(filters.sortBy as string | number | null | undefined) || FILTER_OPTIONS.SORT.RATING
							}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								onFilterChange?.("sortBy", e.target.value)
							}
							options={FILTER_CONFIGS.sort}
							className={styles.filterSelect}
						/>
						<button
							type="button"
							onClick={() =>
								onFilterChange?.(
									"sortOrder",
									(isAsc ? FILTER_OPTIONS.ORDER.DESC : FILTER_OPTIONS.ORDER.ASC) as string,
								)
							}
							className={styles.sortOrderButton}
							title={`Sort ${isAsc ? "Descending" : "Ascending"}`}
							aria-label={`Toggle sort order to ${isAsc ? "descending" : "ascending"}`}
						>
							<SortOrderIcon direction={isAsc ? "asc" : "desc"} className={styles.sortIcon} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
