import { useCallback, useMemo, useState } from "react";
import { FILTER_OPTIONS } from "../../../core/constants";
import { useRouting } from "../../../core/hooks/useRouting";
import useAppStore from "../../../core/store/useAppStore";
import {
	applyNameFilters,
	mapFilterStatusToVisibility,
} from "../../utils/coreUtils";
import type {
	NameItem,
	TournamentFilters,
	UseNameManagementViewProps,
	UseNameManagementViewResult,
} from "../types";
import { useNameData, useNameSelection } from "./useNameManagement";

export function useNameManagementView({
	mode,
	userName,
	profileProps = {},
	analysisMode,
	setAnalysisMode,
}: UseNameManagementViewProps): UseNameManagementViewResult {
	const {
		names,
		isLoading,
		error: dataError,
	} = useNameData({ userName, mode });

	const {
		selectedNames,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll: _selectAll,
		selectedCount,
		clearSelection,
		isSelected,
	} = useNameSelection({
		names,
		mode,
		userName,
	});

	const { errors, ui, uiActions } = useAppStore();
	const isError = mode === "tournament" && (!!errors.current || !!dataError);

	const [showSelectedOnly, setShowSelectedOnly] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("alphabetical");

	const { isSwipeMode, showCatPictures } = ui;
	const { setSwipeMode: setIsSwipeMode } = uiActions;

	const [filterStatus, setFilterStatus] = useState(
		FILTER_OPTIONS.VISIBILITY.VISIBLE,
	);
	const [localUserFilter, setLocalUserFilter] = useState("all");
	const userFilter =
		(profileProps.userFilter as "all" | "user" | "other") ?? localUserFilter;
	const setUserFilter =
		(profileProps.setUserFilter as React.Dispatch<
			React.SetStateAction<"all" | "user" | "other">
		>) ?? setLocalUserFilter;
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [selectionFilter, setSelectionFilter] = useState<
		"all" | "selected" | "unselected"
	>("all");
	const [dateFilter, setDateFilter] = useState<
		"all" | "today" | "week" | "month"
	>("all");
	const [activeTab, setActiveTab] = useState("manage");

	const { navigateTo } = useRouting();

	const handleAnalysisModeToggle = useCallback(() => {
		const newValue = !analysisMode;
		setAnalysisMode(newValue);
		if (typeof window === "undefined") return;
		const currentPath = window.location.pathname;
		const currentSearch = new URLSearchParams(window.location.search);

		if (newValue) {
			currentSearch.set("analysis", "true");
		} else {
			currentSearch.delete("analysis");
		}

		const newSearch = currentSearch.toString();
		const newUrl = newSearch ? `${currentPath}?${newSearch}` : currentPath;
		navigateTo(newUrl);
	}, [navigateTo, setAnalysisMode, analysisMode]);

	const filteredNamesForSwipe = useMemo(() => {
		if (mode !== "tournament") return [];
		const activeFilterStatus = analysisMode ? filterStatus : "visible";
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			searchTerm,
			category: selectedCategory || undefined,
			sortBy,
			sortOrder: sortOrder as "asc" | "desc",
			visibility: activeVisibility,
			isAdmin: profileProps.isAdmin,
		});

		if (showSelectedOnly) {
			result = result.filter((name) =>
				selectedNames.some((s: NameItem) => s.id === name.id),
			);
		}

		return result;
	}, [
		names,
		mode,
		analysisMode,
		filterStatus,
		searchTerm,
		selectedCategory,
		sortBy,
		sortOrder,
		profileProps.isAdmin,
		showSelectedOnly,
		selectedNames,
	]);

	const filteredNames = useMemo(() => {
		const activeFilterStatus =
			mode === "tournament" && !analysisMode ? "visible" : filterStatus;
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			searchTerm,
			category: selectedCategory || undefined,
			sortBy,
			sortOrder: sortOrder as "asc" | "desc",
			visibility: activeVisibility,
			isAdmin: profileProps.isAdmin,
		});

		// Apply additional filters
		if (selectionFilter !== "all") {
			if (selectionFilter === "selected") {
				result = result.filter((n) => isSelected(n));
			} else {
				result = result.filter((n) => !isSelected(n));
			}
		}

		// Logic for userFilter would go here if names needed filtering by user props

		return result;
	}, [
		names,
		mode,
		analysisMode,
		filterStatus,
		searchTerm,
		selectedCategory,
		sortBy,
		sortOrder,
		profileProps.isAdmin,
		selectionFilter,
		isSelected,
	]);

	const filterConfig: TournamentFilters = useMemo(() => {
		if (mode === "tournament" && analysisMode) {
			return {
				searchTerm,
				category: selectedCategory,
				sortBy,
				filterStatus,
				userFilter,
				selectionFilter,
				dateFilter,
				sortOrder,
			};
		} else if (mode === "tournament") {
			return { searchTerm, category: selectedCategory, sortBy, sortOrder };
		} else {
			return { filterStatus, userFilter, selectionFilter, sortBy, sortOrder };
		}
	}, [
		mode,
		analysisMode,
		searchTerm,
		selectedCategory,
		sortBy,
		filterStatus,
		userFilter,
		selectionFilter,
		dateFilter,
		sortOrder,
	]);

	const handleFilterChange = useCallback(
		(name: keyof TournamentFilters, value: string | number | boolean) => {
			if (mode === "tournament" && analysisMode) {
				switch (name) {
					case "searchTerm":
						setSearchTerm(String(value) || "");
						break;
					case "category":
						setSelectedCategory(String(value) || "");
						break;
					case "sortBy":
						setSortBy(String(value) || "alphabetical");
						break;
					case "filterStatus":
						setFilterStatus(String(value));
						break;
					case "userFilter":
						setUserFilter(String(value) as "all" | "user" | "other");
						break;
					case "selectionFilter":
						setSelectionFilter(
							String(value) as "all" | "selected" | "unselected",
						);
						break;
					case "dateFilter":
						setDateFilter(
							(String(value) as "all" | "today" | "week" | "month") || "all",
						);
						break;
					case "sortOrder":
						setSortOrder(String(value) as "asc" | "desc");
						break;
				}
			} else if (mode === "tournament") {
				switch (name) {
					case "searchTerm":
						setSearchTerm(String(value) || "");
						break;
					case "category":
						setSelectedCategory(String(value) || "");
						break;
					case "sortBy":
						setSortBy(String(value) || "alphabetical");
						break;
				}
			} else {
				switch (name) {
					case "filterStatus":
						setFilterStatus(String(value));
						break;
					case "userFilter":
						setUserFilter(String(value) as "all" | "user" | "other");
						break;
					case "selectionFilter":
						setSelectionFilter(
							String(value) as "all" | "selected" | "unselected",
						);
						break;
					case "sortBy":
						setSortBy(String(value) || "alphabetical");
						break;
					case "sortOrder":
						setSortOrder(String(value) as "asc" | "desc");
						break;
				}
			}
		},
		[mode, analysisMode, setUserFilter],
	);

	// Stats calculation
	const stats = useMemo(
		() => ({
			total: names.length,
			visible: filteredNames.length,
			selected: selectedCount,
		}),
		[names.length, filteredNames.length, selectedCount],
	);

	const uniqueCategories = useMemo(() => {
		return Array.from(
			new Set(names.map((n: NameItem) => n.category || "Uncategorized")),
		).filter(Boolean) as string[];
	}, [names]);

	return {
		names,
		isLoading,
		error: isError ? (dataError as Error) : null,

		selectedNames,
		isSelectionMode: false,
		setIsSelectionMode: () => {},
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		clearSelection,
		selectAll: _selectAll,

		searchQuery: searchTerm,
		setSearchQuery: setSearchTerm,
		filterStatus,
		setFilterStatus,
		sortBy,
		setSortBy,
		sortOrder,
		setSortOrder,
		selectedCategory,
		setSelectedCategory,
		showSelectedOnly,
		setShowSelectedOnly,
		selectionFilter,
		setSelectionFilter,
		userFilter,
		setUserFilter,
		dateFilter,
		setDateFilter,

		isSwipeMode,
		setIsSwipeMode,
		showCatPictures,

		activeTab,
		setActiveTab,

		filteredNames,
		filteredNamesForSwipe,
		uniqueCategories,
		stats,
		filterConfig,
		handleFilterChange,
		handleAnalysisModeToggle,
	};
}
