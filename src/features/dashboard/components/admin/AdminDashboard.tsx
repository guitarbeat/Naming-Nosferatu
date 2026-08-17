import { AnimatePresence, motion } from "framer-motion";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import { AdminAnalyticsTab } from "./components/AdminAnalyticsTab";
import { AdminNamesTab } from "./components/AdminNamesTab";
import { AdminOverviewTab } from "./components/AdminOverviewTab";
import { AdminStatsGrid } from "./components/AdminStatsGrid";
import { AdminUsersTab } from "./components/AdminUsersTab";
import { ADMIN_TABS, FILTER_OPTIONS } from "./constants";
import { useAdminDashboard } from "./hooks/useAdminDashboard";

export function AdminDashboard() {
	const {
		activeTab,
		setActiveTab,
		searchTerm,
		setSearchTerm,
		filterStatus,
		selectedNames,
		stats,
		isLoading,
		filteredNames,
		handleToggleHidden,
		handleToggleLocked,
		handleBulkAction,
		handleSoftDelete,
		handleImageUpload,
		handleSelectionChange,
		handleFilterChange,
		handleRefresh,
		handleClearSelection,
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

			<div className="mb-4 sm:mb-6 overflow-x-auto">
				<MagicToggle
					options={ADMIN_TABS}
					value={activeTab}
					onChange={setActiveTab}
					ariaLabel="Admin dashboard sections"
					size="small"
				/>
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -20 }}
				>
					{activeTab === "names" ? (
						<AdminNamesTab
							searchTerm={searchTerm}
							onSearchTermChange={setSearchTerm}
							filterStatus={filterStatus}
							filterOptions={FILTER_OPTIONS}
							onFilterChange={handleFilterChange}
							onRefresh={handleRefresh}
							selectedNames={selectedNames}
							onBulkAction={(action) => void handleBulkAction(action)}
							onClearSelection={handleClearSelection}
							filteredNames={filteredNames}
							onSelectionChange={handleSelectionChange}
							onToggleHidden={(nameId, hidden) => void handleToggleHidden(nameId, hidden)}
							onToggleLocked={(nameId, locked) => void handleToggleLocked(nameId, locked)}
							onDelete={(nameId) => void handleSoftDelete(nameId)}
						/>
					) : activeTab === "overview" ? (
						<AdminOverviewTab onImageUpload={handleImageUpload} />
					) : activeTab === "users" ? (
						<AdminUsersTab />
					) : (
						<AdminAnalyticsTab />
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
