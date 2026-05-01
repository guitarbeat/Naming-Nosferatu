import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
	type ChangeEvent,
	type ElementType,
	useCallback,
	useMemo,
	useState,
} from "react";
import { AdminNamesTab } from "@/features/admin/components/AdminNamesTab";
import { useNameAdminActions } from "@/features/names/hooks/useNameAdminActions";
import { namesQueryOptions } from "@/features/names/api";
import { Loading } from "@/shared/components/layout/Feedback";
import { BarChart3, Eye, EyeOff, Lock } from "@/shared/lib/icons";
import {
	getActiveNames,
	getHiddenNames,
	getLockedNames,
	matchesNameSearchTerm,
} from "@/shared/lib/names/nameFilters";
import { addToSet, removeFromSet } from "@/shared/lib/setUtils";
import { statsAPI } from "@/shared/services/supabase/statsService";
import type { NameItem } from "@/shared/types";
import useAppStore from "@/store/appStore";

type DashboardTab = "overview" | "names" | "users" | "analytics";
type NameFilter = "all" | "active" | "hidden" | "locked";
type BulkAction = "hide" | "unhide" | "lock" | "unlock";

interface AdminStats {
	totalNames: number;
	activeNames: number;
	hiddenNames: number;
	lockedInNames: number;
	totalUsers: number;
	recentVotes: number;
}

interface NameWithStats extends NameItem {
	votes?: number;
	lastVoted?: string;
	popularityScore?: number;
}

interface SiteStatsLike {
	totalUsers?: unknown;
	totalRatings?: unknown;
}

interface AdminTabNavProps<TTab extends string> {
	activeTab: TTab;
	tabs: readonly { id: TTab; label: string }[];
	onTabChange: (tab: TTab) => void;
}

interface AdminOverviewTabProps {
	onImageUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface AdminPlaceholderTabProps {
	title: string;
	message: string;
}

interface AdminStatsGridProps {
	stats: Pick<
		AdminStats,
		"totalNames" | "activeNames" | "hiddenNames" | "lockedInNames"
	>;
}

interface StatCell {
	icon: ElementType;
	colorClass: string;
	label: string;
	value: number;
}

const ADMIN_TABS: readonly { id: DashboardTab; label: string }[] = [
	{ id: "overview", label: "Overview" },
	{ id: "names", label: "Names" },
	{ id: "users", label: "Users" },
	{ id: "analytics", label: "Analytics" },
];

const FILTER_OPTIONS: readonly { value: NameFilter; label: string }[] = [
	{ value: "all", label: "All Names" },
	{ value: "active", label: "Active" },
	{ value: "hidden", label: "Hidden" },
	{ value: "locked", label: "Locked In" },
];

function toNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function mapNameToDisplay(name: NameItem): NameWithStats {
	return {
		...name,
		votes: Number((name.wins || 0) + (name.losses || 0)),
		lastVoted: undefined,
		popularityScore: Number(name.popularity_score ?? 0),
	};
}

function buildAdminStats(
	names: NameWithStats[],
	siteStats: SiteStatsLike | null,
): AdminStats {
	return {
		totalNames: names.length,
		activeNames: getActiveNames(names).length,
		hiddenNames: getHiddenNames(names).length,
		lockedInNames: getLockedNames(names).length,
		totalUsers: toNumber(siteStats?.totalUsers),
		recentVotes: toNumber(siteStats?.totalRatings),
	};
}

function filterNamesByStatusAndSearch(
	names: NameWithStats[],
	filterStatus: NameFilter,
	searchTerm: string,
): NameWithStats[] {
	let filtered = names;

	if (filterStatus === "active") {
		filtered = getActiveNames(filtered);
	} else if (filterStatus === "hidden") {
		filtered = getHiddenNames(filtered);
	} else if (filterStatus === "locked") {
		filtered = getLockedNames(filtered);
	}

	const normalizedSearch = searchTerm.trim().toLowerCase();
	if (!normalizedSearch) {
		return filtered;
	}

	return filtered.filter((name) =>
		matchesNameSearchTerm(name, normalizedSearch),
	);
}

function AdminTabNav<TTab extends string>({
	activeTab,
	tabs,
	onTabChange,
}: AdminTabNavProps<TTab>) {
	return (
		<div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-border/10 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					onClick={() => onTabChange(tab.id)}
					className={`px-3 sm:px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
						activeTab === tab.id
							? "text-foreground border-b-2 border-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					{tab.label}
				</button>
			))}
		</div>
	);
}

function AdminOverviewTab({ onImageUpload }: AdminOverviewTabProps) {
	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<h3 className="text-lg font-semibold mb-2">Image Upload</h3>
					<input
						type="file"
						accept="image/*"
						onChange={onImageUpload}
						className="w-full p-2 bg-foreground/10 border border-border/20 rounded"
					/>
					<p className="text-xs text-muted-foreground mt-2">Check console for upload status</p>
				</div>
				<div>
					<h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
					<p className="text-muted-foreground">
						Activity tracking coming soon...
					</p>
				</div>
			</div>
		</div>
	);
}

function AdminPlaceholderTab({ title, message }: AdminPlaceholderTabProps) {
	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-4">{title}</h2>
			<p className="text-muted-foreground">{message}</p>
		</div>
	);
}

function AdminStatCell({ icon: Icon, colorClass, label, value }: StatCell) {
	return (
		<div className="p-3 sm:p-6">
			<div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
				<Icon className={colorClass} size={18} />
				<h3 className={`text-sm sm:text-lg font-semibold ${colorClass}`}>
					{label}
				</h3>
			</div>
			<p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
		</div>
	);
}

function AdminStatsGrid({ stats }: AdminStatsGridProps) {
	const cells: StatCell[] = [
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
	];

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
			{cells.map((cell) => (
				<AdminStatCell key={cell.label} {...cell} />
			))}
		</div>
	);
}

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
			if (
				!window.confirm("Permanently delete this name? This cannot be undone.")
			) {
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

	const handleTabChange = useCallback((tab: DashboardTab) => {
		setActiveTab(tab);
	}, []);

	const handleFilterChange = useCallback(
		(event: ChangeEvent<HTMLSelectElement>) => {
			const option = FILTER_OPTIONS.find(
				(item) => item.value === event.target.value,
			);
			if (option) {
				setFilterStatus(option.value);
			}
		},
		[],
	);

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

			{stats && <AdminStatsGrid stats={stats} />}

			<AdminTabNav
				activeTab={activeTab}
				tabs={ADMIN_TABS}
				onTabChange={handleTabChange}
			/>

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
