import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { type ChangeEvent, useCallback, useMemo, useState } from "react";
import { AdminNamesTab } from "@/features/admin/components/AdminNamesTab";
import { AdminOverviewTab } from "@/features/admin/components/AdminOverviewTab";
import { AdminPlaceholderTab } from "@/features/admin/components/AdminPlaceholderTab";
import { AdminStatsGrid } from "@/features/admin/components/AdminStatsGrid";
import { AdminTabNav } from "@/features/admin/components/AdminTabNav";
import { ADMIN_TABS, FILTER_OPTIONS } from "@/features/admin/constants";
import type { BulkAction, DashboardTab, NameFilter } from "@/features/admin/types";
import {
	buildAdminStats,
	filterNamesByStatusAndSearch,
	mapNameToDisplay,
} from "@/features/admin/utils/adminUtils";
import { namesQueryOptions } from "@/features/names/api";
import { useNameAdminActions } from "@/features/names/hooks/useNameAdminActions";
import { Loading } from "@/shared/components/layout/Feedback";
import { addToSet, removeFromSet } from "@/shared/lib/setUtils";
import { statsAPI } from "@/shared/services/supabase/statsService";
import useAppStore from "@/store/appStore";

export function AdminDashboard() {
	const { user } = useAppStore();
	const actorName = user.name.trim();
	const {
		batchUpdateLocked: applyBatchLocked,
		batchUpdateVisibility: applyBatchVisibility,
		deleteName,
		toggleHidden,
		toggleLocked,
		uploadImage,
	} = useNameAdminActions(actorName);

	const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<NameFilter>("all");
	const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
	const namesQuery = useQuery(namesQueryOptions(true));
	const siteStatsQuery = useQuery({
		queryKey: ["site-stats"],
		queryFn: () => statsAPI.getSiteStats(),
		staleTime: 30_000,
	});
	const names = useMemo(
		() => (namesQuery.data?.names ?? []).map(mapNameToDisplay),
		[namesQuery.data?.names],
	);
	const stats = useMemo(
		() => buildAdminStats(names, siteStatsQuery.data),
		[names, siteStatsQuery.data],
	);
	const isLoading = namesQuery.isPending || siteStatsQuery.isPending;

	const filteredNames = useMemo(
		() => filterNamesByStatusAndSearch(names, filterStatus, searchTerm),
		[names, filterStatus, searchTerm],
	);

	const handleToggleHidden = useCallback(
		async (nameId: string | number, isHidden: boolean) => {
			try {
				await toggleHidden({
					nameId: String(nameId),
					isCurrentlyHidden: isHidden,
				});
			} catch (error) {
				console.error("Failed to toggle hidden status:", error);
			}
		},
		[toggleHidden],
	);

	const handleToggleLocked = useCallback(
		async (nameId: string | number, isLocked: boolean) => {
			try {
				await toggleLocked({
					nameId: String(nameId),
					isCurrentlyLocked: isLocked,
				});
			} catch (error) {
				console.error("Failed to toggle locked status:", error);
			}
		},
		[toggleLocked],
	);

	const handleBulkAction = useCallback(
		async (action: BulkAction) => {
			if (selectedNames.size === 0) {
				return;
			}

			const ids = Array.from(selectedNames);

			try {
				if (action === "hide" || action === "unhide") {
					await applyBatchVisibility({
						nameIds: ids,
						isHidden: action === "hide",
					});
				} else {
					await applyBatchLocked({
						nameIds: ids,
						isLocked: action === "lock",
					});
				}
				setSelectedNames(new Set());
			} catch (error) {
				console.error("Failed to perform bulk action:", error);
			}
		},
		[applyBatchLocked, applyBatchVisibility, selectedNames],
	);

	const handleSoftDelete = useCallback(
		async (nameId: string | number) => {
			if (!window.confirm("Permanently delete this name? This cannot be undone.")) {
				return;
			}
			try {
				await deleteName({ nameId });
			} catch (error) {
				console.error("Failed to delete name:", error);
			}
		},
		[deleteName],
	);

	const handleImageUpload = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				return;
			}

			try {
				const result = await uploadImage(file);
				if (!result.success) {
					console.error("Upload failed:", result.error);
				}
			} catch (error) {
				console.error("Upload error:", error);
			}
		},
		[uploadImage],
	);

	const handleSelectionChange = useCallback((nameId: string, checked: boolean) => {
		setSelectedNames((prevSelectedNames) => {
			return checked
				? addToSet(prevSelectedNames, nameId)
				: removeFromSet(prevSelectedNames, nameId);
		});
	}, []);

	const handleTabChange = useCallback((tab: DashboardTab) => {
		setActiveTab(tab);
	}, []);

	const handleFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		const option = FILTER_OPTIONS.find((item) => item.value === event.target.value);
		if (option) {
			setFilterStatus(option.value);
		}
	}, []);

	const handleRefresh = useCallback(() => {
		void Promise.all([namesQuery.refetch(), siteStatsQuery.refetch()]);
	}, [namesQuery, siteStatsQuery]);

	const handleClearSelection = useCallback(() => {
		setSelectedNames(new Set());
	}, []);

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

			<AdminTabNav activeTab={activeTab} tabs={ADMIN_TABS} onTabChange={handleTabChange} />

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
						<AdminPlaceholderTab
							title="User Analytics"
							message="User tracking and analytics coming soon..."
						/>
					) : (
						<AdminPlaceholderTab
							title="Site Analytics"
							message="Advanced analytics coming soon..."
						/>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
