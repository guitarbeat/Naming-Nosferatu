import React from "react";
import { NameGrid } from "../../NameGrid/NameGrid";
import { TournamentToolbar } from "../../TournamentToolbar/TournamentToolbar";
import { NameManagementViewExtensions, NameManagementViewProfileProps, TournamentFilters } from "../nameManagementCore";
import styles from "../NameManagementView.module.css";

interface ProfileModeProps {
	filterConfig: TournamentFilters;
	handleFilterChange: (name: string, value: string) => void;
	names: any[];
	isLoading: boolean;
	extensions: NameManagementViewExtensions;
	profileProps: NameManagementViewProfileProps;
	selectedNames: any[];
	toggleName: (name: any) => void;
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
					{typeof extensions.header === "function"
						? extensions.header()
						: extensions.header}
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
					onFilterChange={handleFilterChange}
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
					{typeof extensions.bulkActions === "function"
						? React.createElement(
								extensions.bulkActions as React.ComponentType<any>,
								{
									onExport: () => {
										console.log("Export", names.length, "names");
									},
								},
							)
						: null}
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
					onToggleVisibility={profileProps.onToggleVisibility}
					onDelete={profileProps.onDelete}
					isLoading={isLoading}
				/>
			</section>

			{/* Navbar Extension */}
			{extensions.navbar && (
				<div className={styles.navbarSection}>
					{typeof extensions.navbar === "function"
						? extensions.navbar()
						: extensions.navbar}
				</div>
			)}
		</div>
	);
}
