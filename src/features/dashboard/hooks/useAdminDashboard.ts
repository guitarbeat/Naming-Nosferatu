import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback, useMemo, useState } from "react";
import { namesQueryOptions, statsAPI, useNameAdminActions } from "@/shared/api";
import useAppStore from "@/store";
import type { NameFilter } from "../types";
import {
	buildAdminStats,
	FILTER_OPTIONS,
	filterNamesByStatusAndSearch,
	mapNameToDisplay,
} from "../utils";

export function useAdminDashboard() {
	const user = useAppStore((s) => s.user);
	const actorName = user.name.trim();
	const { deleteName, toggleHidden, toggleLocked } = useNameAdminActions(actorName);

	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<NameFilter>("all");
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

	const handleSoftDelete = useCallback(
		async (nameId: string | number) => {
			if (!window.confirm("Permanently delete this name? This cannot be undone.")) {
				return;
			}
			await deleteName({ nameId: String(nameId) });
		},
		[deleteName],
	);

	const handleFilterChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
		const option = FILTER_OPTIONS.find((item) => item.value === event.target.value);
		if (option) {
			setFilterStatus(option.value);
		}
	}, []);

	const handleRefresh = useCallback(() => {
		void Promise.all([namesQuery.refetch(), siteStatsQuery.refetch()]);
	}, [namesQuery, siteStatsQuery]);

	return {
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
	};
}
