import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Eye, EyeOff, Lock } from "lucide-react";
import { type ChangeEvent, useCallback, useMemo, useState } from "react";
import { namesQueryOptions } from "@/shared/api/names/api";
import { useNameAdminActions } from "@/shared/api/names/hooks/useNameAdminActions";
import { Loading } from "@/shared/components/layout/Feedback/Loading";
import { MagicToggle } from "@/shared/components/ui/MagicToggle";
import { addToSet, removeFromSet } from "@/shared/lib/setUtils";
import { statsAPI } from "@/shared/services/supabase/statsService";
import useAppStore from "@/store/appStore";
import { AdminNamesTab } from "./components/AdminNamesTab";
import { ADMIN_TABS, FILTER_OPTIONS } from "./constants";
import type { BulkAction, DashboardTab, NameFilter } from "./types";
import {
	buildAdminStats,
	filterNamesByStatusAndSearch,
	mapNameToDisplay,
} from "./utils";

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
			await toggleHidden({
				nameId: String(nameId),
				isCurrentlyHidden: isHidden,
			});
		},
		[toggleHidden],
	);

	const handleToggleLocked = useCallback(
		async (nameId: string | number, isLocked: boolean) => {
			await toggleLocked({
				nameId: String(nameId),
				isCurrentlyLocked: isLocked,
			});
		},
		[toggleLocked],
	);

	const handleBulkAction = useCallback(
		async (action: BulkAction) => {
			if (selectedNames.size === 0) {
				return;
			}

			const ids = Array.from(selectedNames);

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
		},
		[applyBatchLocked, applyBatchVisibility, selectedNames],
	);

	const handleSoftDelete = useCallback(
		async (nameId: string | number) => {
			if (
				!window.confirm("Permanently delete this name? This cannot be undone.")
			) {
				return;
			}
			await deleteName({ nameId });
		},
		[deleteName],
	);

	const handleImageUpload = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) {
				return;
			}

			await uploadImage(file);
		},
		[uploadImage],
	);

	const handleSelectionChange = useCallback(
		(nameId: string, checked: boolean) => {
			setSelectedNames((prevSelectedNames) => {
				return checked
					? addToSet(prevSelectedNames, nameId)
					: removeFromSet(prevSelectedNames, nameId);
			});
		},
		[],
	);

	const handleFilterChange = useCallback((value: string) => {
		const option = FILTER_OPTIONS.find((item) => item.value === value);
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
				<p className="text-sm text-muted-foreground">
					Manage names and monitor activity
				</p>
			</div>

			{stats && (
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
					{[
						{
							icon: BarChart3,
							colorClass: "text-primary",
							label: "Total",
							value: stats.totalNames,
						},
						{
							icon: Eye,
							colorClass: "text-chart-2",
							label: "Active",
							value: stats.activeNames,
						},
						{
							icon: Lock,
							colorClass: "text-chart-4",
							label: "Locked",
							value: stats.lockedInNames,
						},
						{
							icon: EyeOff,
							colorClass: "text-destructive",
							label: "Hidden",
							value: stats.hiddenNames,
						},
					].map(({ icon: Icon, colorClass, label, value }) => (
						<div key={label} className="p-3 sm:p-6">
							<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
								<Icon className={colorClass} size={18} />
								<h3
									className={`text-sm sm:text-lg font-semibold ${colorClass}`}
								>
									{label}
								</h3>
							</div>
							<p className="text-2xl sm:text-3xl font-bold text-foreground">
								{value}
							</p>
						</div>
					))}
				</div>
			)}

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
							onToggleHidden={(nameId, hidden) =>
								void handleToggleHidden(nameId, hidden)
							}
							onToggleLocked={(nameId, locked) =>
								void handleToggleLocked(nameId, locked)
							}
							onDelete={(nameId) => void handleSoftDelete(nameId)}
						/>
					) : activeTab === "overview" ? (
						<div className="p-6">
							<h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<h3 className="text-lg font-semibold mb-2">Image Upload</h3>
									<input
										type="file"
										accept="image/*"
										onChange={handleImageUpload}
										className="w-full p-2 bg-foreground/10 border border-border/20 rounded"
									/>
									<p className="text-xs text-muted-foreground mt-2">
										Upload errors will appear in the console.
									</p>
								</div>
								<div>
									<h3 className="text-lg font-semibold mb-2">
										Recent Activity
									</h3>
									<p className="text-muted-foreground">
										Activity tracking coming soon...
									</p>
								</div>
							</div>
						</div>
					) : activeTab === "users" ? (
						<div className="p-6">
							<h2 className="text-2xl font-bold mb-4">User Analytics</h2>
							<p className="text-muted-foreground">
								User tracking and analytics coming soon...
							</p>
						</div>
					) : (
						<div className="p-6">
							<h2 className="text-2xl font-bold mb-4">Site Analytics</h2>
							<p className="text-muted-foreground">
								Advanced analytics coming soon...
							</p>
						</div>
					)}
				</motion.div>
			</AnimatePresence>
		</div>
	);
}
