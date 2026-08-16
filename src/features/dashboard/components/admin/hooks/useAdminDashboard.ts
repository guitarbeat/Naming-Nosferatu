import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useMemo, useState } from "react";
import { namesQueryOptions } from "@/shared/api/names/api";
import { useNameAdminActions } from "@/shared/api/names/hooks/useNameAdminActions";
import { addToSet, removeFromSet } from "@/shared/lib/setUtils";
import { statsAPI } from "@/shared/services/supabase/statsService";
import useAppStore from "@/store/appStore";
import { FILTER_OPTIONS } from "../constants";
import type { BulkAction, DashboardTab, NameFilter } from "../types";
import {
	buildAdminStats,
	filterNamesByStatusAndSearch,
	mapNameToDisplay,
} from "../utils";

export function useAdminDashboard() {
	const user = useAppStore((s) => s.user);
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
		() => buildAdminStats(names, siteStatsQuery.data ?? null),
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
			await deleteName({ nameId: String(nameId) });
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

	return {
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
	};
}
