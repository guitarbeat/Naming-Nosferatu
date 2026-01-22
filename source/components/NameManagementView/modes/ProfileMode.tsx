import { NameGrid } from "@components/NameGrid";
import { TournamentToolbar } from "@components/TournamentToolbar";
import React from "react";
import type { NameItem } from "@/types/components";
import styles from "../NameManagementView.module.css";
import type {
	NameManagementViewExtensions,
	NameManagementViewProfileProps,
	TournamentFilters,
} from "../nameManagementCore";

interface ProfileModeProps {
	filterConfig: TournamentFilters;
	handleFilterChange: (name: keyof TournamentFilters, value: string | number | boolean) => void;
	names: NameItem[];
	isLoading: boolean;
	extensions: NameManagementViewExtensions;
	profileProps: NameManagementViewProfileProps;
	selectedNames: NameItem[];
	toggleName: (name: NameItem) => void;
	categories?: string[];
}

export function ProfileMode({
	filterConfig,
	handleFilterChange,
	names,
	isLoading,
	extensions,
	profileProps,
	selectedNames,
	toggleName,
	categories,
}: ProfileModeProps) {
	return (
		<div className={styles.container} data-mode="profile">
			{/* Header Extension */}
			{extensions.header && (
				<div className={styles.headerSection}>
					{typeof extensions.header === "function" ? extensions.header() : extensions.header}
				</div>
			)}

			{/* Dashboard Extension */}
			{extensions.dashboard && (
				<section className={styles.dashboardSection}>
					{React.isValidElement(extensions.dashboard)
						? extensions.dashboard
						: typeof extensions.dashboard === "function"
							? React.createElement(extensions.dashboard as React.ComponentType)
							: extensions.dashboard}
				</section>
			)}

			{/* Filters */}
			<section className={styles.filtersSection}>
				<TournamentToolbar
					mode="profile"
					filters={filterConfig}
					onFilterChange={handleFilterChange as (name: string, value: string) => void}
					categories={categories || []}
					showUserFilter={profileProps.showUserFilter}
					showSelectionFilter={!!profileProps.selectionStats}
					userOptions={profileProps.userOptions}
					filteredCount={names.length} // Simplified
					totalCount={names.length}
				/>
			</section>

			{/* Bulk Actions Extension */}
			{extensions.bulkActions && (
				<section className={styles.bulkActionsSection}>
					{extensions.bulkActions &&
						React.createElement(extensions.bulkActions, {
							onExport: () => {
								console.log("Export", names.length, "names");
							},
						})}
				</section>
			)}

			{/* Name Grid */}
			<section className={styles.gridSection}>
				<NameGrid
					names={names}
					selectedNames={selectedNames}
					onToggleName={toggleName}
					filters={filterConfig}
					isAdmin={!!profileProps.isAdmin}
					onToggleVisibility={
						profileProps.onToggleVisibility
							? (id: string | number) => {
									profileProps.onToggleVisibility?.(String(id)).catch(console.error);
								}
							: undefined
					}
					onDelete={
						profileProps.onDelete
							? (name: NameItem) => {
									profileProps.onDelete?.(name).catch(console.error);
								}
							: undefined
					}
					isLoading={isLoading}
				/>
			</section>

			{/* Navbar Extension */}
			{extensions.navbar && (
				<div className={styles.navbarSection}>
					{typeof extensions.navbar === "function" ? extensions.navbar() : extensions.navbar}
				</div>
			)}
		</div>
	);
}
