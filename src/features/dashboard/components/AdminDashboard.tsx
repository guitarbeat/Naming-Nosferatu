import { Loading } from "@/shared/components";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { FILTER_OPTIONS } from "../utils";
import { AdminNamesTab } from "./AdminNamesTab";
import { AdminStatsGrid } from "./AdminStatsGrid";

export function AdminDashboard() {
	const {
		searchTerm,
		setSearchTerm,
		filterStatus,
		stats,
		isLoading,
		filteredNames,
		handleToggleHidden,
		handleToggleLocked,
		handleSoftDelete,
		handleFilterChange,
		handleRefresh,
	} = useAdminDashboard();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loading variant="spinner" text="Loading admin dashboard..." />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground p-3 sm:p-6">
			<div className="mb-4 sm:mb-8">
				<h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
					Admin Dashboard
				</h1>
				<p className="text-sm text-muted-foreground">Manage names and monitor activity</p>
			</div>

			{stats && <AdminStatsGrid stats={stats} />}

			<AdminNamesTab
				searchTerm={searchTerm}
				onSearchTermChange={setSearchTerm}
				filterStatus={filterStatus}
				filterOptions={FILTER_OPTIONS}
				onFilterChange={handleFilterChange}
				onRefresh={handleRefresh}
				filteredNames={filteredNames}
				onToggleHidden={(nameId, hidden) => void handleToggleHidden(nameId, hidden)}
				onToggleLocked={(nameId, locked) => void handleToggleLocked(nameId, locked)}
				onDelete={(nameId) => void handleSoftDelete(nameId)}
			/>
		</div>
	);
}
