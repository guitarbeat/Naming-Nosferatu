/**
 * @module nameManagementCore
 * @description Consolidated core logic for NameManagementView.
 * Includes Types, Context, and Hooks for name data and selection management.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FILTER_OPTIONS } from "../../../core/constants";
import { useRouting } from "../../../core/hooks/useRouting";
import useAppStore from "../../../core/store/useAppStore";
import type { NameItem } from "../../../types/components";
import { applyNameFilters, mapFilterStatusToVisibility } from "../../utils/core";
import type { TournamentFilters, UseNameManagementViewProps } from "./shared/types";
import { useNameData } from "./shared/useNameData";
import { useNameSelection } from "./shared/useNameSelection";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Extension points for customizing NameManagementView behavior
 */
export interface NameManagementViewExtensions {
	header?: React.ReactNode | (() => React.ReactNode);
	dashboard?: React.ReactNode | (() => React.ReactNode) | React.ComponentType;
	bulkActions?: React.ComponentType<{ onExport?: () => void }>;
	contextLogic?: React.ReactNode | (() => React.ReactNode);
	nameGrid?: React.ReactNode;
	navbar?: React.ReactNode | (() => React.ReactNode);
}

/**
 * Props specific to Profile mode
 */
export interface NameManagementViewProfileProps {
	showUserFilter?: boolean;
	selectionStats?: {
		total: number;
		selected: number;
		visible: number;
		hidden: number;
	};
	userOptions?: Array<{ value: string; label: string }>;
	isAdmin?: boolean;
	onToggleVisibility?: (nameId: string) => Promise<void>;
	onDelete?: (name: NameItem) => Promise<void>;
}

// Context Definition
export const NameManagementContext = createContext<UseNameManagementViewResult | null>(null);

export function NameManagementProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: UseNameManagementViewResult;
}) {
	return <NameManagementContext.Provider value={value}>{children}</NameManagementContext.Provider>;
}

export function useNameManagementContextSafe() {
	const context = useContext(NameManagementContext);
	if (!context) {
		throw new Error("useNameManagementContextSafe must be used within NameManagementProvider");
	}
	return context;
}

// Type for the hook return value
export interface UseNameManagementViewResult {
	// Core data
	names: NameItem[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	dataError: Error | null;
	refetch: () => void;
	clearErrors: () => void;

	// Selection state
	selectedNames: Set<string | number>;
	selectedIds: unknown;
	isSelectionMode: boolean;
	setIsSelectionMode: () => void;
	toggleName: (id: string | number) => void;
	toggleNameById: (nameId: string, selected: boolean) => void;
	toggleNamesByIds: (nameIds: string[], shouldSelect?: boolean) => void;
	clearSelection: () => void;
	selectAll: () => void;
	isSelected: (item: NameItem) => boolean;
	selectedCount: number;

	// Filtering and sorting
	searchQuery: string;
	setSearchQuery: (query: string) => void;
	filterStatus: string;
	setFilterStatus: (status: string) => void;
	sortBy: string;
	setSortBy: (sortBy: string) => void;
	sortOrder: "asc" | "desc";
	setSortOrder: (order: "asc" | "desc") => void;
	selectedCategory: string;
	setSelectedCategory: (category: string) => void;
	showSelectedOnly: boolean;
	setShowSelectedOnly: (show: boolean) => void;
	selectionFilter: string;
	setSelectionFilter: (filter: string) => void;
	userFilter: string;
	setUserFilter: (filter: "all" | "user" | "other") => void;
	dateFilter: "all" | "today" | "week" | "month";
	setDateFilter: (filter: "all" | "today" | "week" | "month") => void;

	// UI state
	isSwipeMode: boolean;
	showCatPictures: boolean;
	activeTab: string;
	setActiveTab: (tab: string) => void;
	analysisMode: boolean;
	setAnalysisMode: (mode: boolean) => void;

	// Computed values
	sortedNames: NameItem[];
	filteredNames: NameItem[];
	filteredNamesForSwipe: NameItem[];
	uniqueCategories: string[];
	stats: {
		total: number;
		visible: number;
		hidden: number;
		selected: number;
	};
	filterConfig: TournamentFilters;
	handleFilterChange: (name: keyof TournamentFilters, value: string | number | boolean) => void;
	handleAnalysisModeToggle: () => void;

	// Additional properties
	categories: string[];
	profileProps: {
		showUserFilter?: boolean;
		selectionStats?: unknown;
		userOptions?: Array<{ value: string; label: string }>;
		isAdmin?: boolean;
		[key: string]: unknown;
	};
	tournamentProps: Record<string, unknown>;

	// Extensions
	extensions: NameManagementViewExtensions;
}

export type { TournamentFilters, UseNameManagementViewProps, NameItem };

// ============================================================================
// HOOKS - Name Management View State
// ============================================================================

export function useNameManagementView({
	mode,
	userName,
	profileProps = {},
	tournamentProps = {},
	analysisMode,
	setAnalysisMode,
	extensions = {},
}: UseNameManagementViewProps) {
	const {
		names,
		isLoading,
		error: dataError,
		refetch,
	} = useNameData({ userName: userName ?? null, mode });

	const {
		selectedNames,
		selectedIds,
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
		userName: userName ?? null,
	});

	const { errors, ui, errorActions } = useAppStore();
	const isError = mode === "tournament" && (!!errors.current || !!dataError);
	const clearErrors =
		errorActions?.clearError ??
		(() => {
			// Intentional no-op: fallback when errorActions not available
		});

	const [showSelectedOnly, setShowSelectedOnly] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("alphabetical");

	const { isSwipeMode, showCatPictures } = ui;

	const [filterStatus, setFilterStatus] = useState(FILTER_OPTIONS.VISIBILITY.VISIBLE);
	const [localUserFilter, setLocalUserFilter] = useState("all");
	const userFilter = (profileProps.userFilter as "all" | "user" | "other") ?? localUserFilter;
	const setUserFilter =
		(profileProps.setUserFilter as React.Dispatch<
			React.SetStateAction<"all" | "user" | "other">
		>) ?? setLocalUserFilter;
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [selectionFilter, setSelectionFilter] = useState<"all" | "selected" | "unselected">("all");
	const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
	const [activeTab, setActiveTab] = useState("manage");

	const { navigateTo } = useRouting();

	const handleAnalysisModeToggle = useCallback(() => {
		const newValue = !analysisMode;
		setAnalysisMode(newValue);
		if (typeof window === "undefined") {
			return;
		}
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
		if (mode !== "tournament") {
			return [];
		}
		const activeFilterStatus = analysisMode ? filterStatus : "visible";
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			searchTerm,
			category: selectedCategory || undefined,
			sortBy,
			sortOrder: sortOrder as "asc" | "desc",
			visibility: activeVisibility,
			isAdmin: Boolean(profileProps.isAdmin),
		});

		if (showSelectedOnly) {
			result = result.filter((name) => selectedNames.some((s: NameItem) => s.id === name.id));
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
		const activeFilterStatus = mode === "tournament" && !analysisMode ? "visible" : filterStatus;
		const activeVisibility = mapFilterStatusToVisibility(activeFilterStatus);

		let result = applyNameFilters(names, {
			searchTerm,
			category: selectedCategory || undefined,
			sortBy,
			sortOrder: sortOrder as "asc" | "desc",
			visibility: activeVisibility,
			isAdmin: Boolean(profileProps.isAdmin),
		});

		// Apply additional filters
		if (selectionFilter !== "all") {
			if (selectionFilter === "selected") {
				result = result.filter((n) => isSelected(n));
			} else {
				result = result.filter((n) => !isSelected(n));
			}
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
		selectionFilter,
		isSelected,
	]);

	const filterConfig: TournamentFilters = useMemo(() => {
		if (mode === "tournament" && analysisMode) {
			return {
				searchTerm,
				category: selectedCategory,
				sortBy,
				filterStatus: filterStatus as "all" | "visible" | "hidden",
				userFilter: userFilter as "all" | "user" | "other",
				selectionFilter: selectionFilter as "all" | "selected" | "unselected",
				dateFilter: dateFilter as "all" | "today" | "week" | "month",
				sortOrder,
			};
		} else if (mode === "tournament") {
			return { searchTerm, category: selectedCategory, sortBy, sortOrder };
		} else {
			return {
				filterStatus: filterStatus as "all" | "visible" | "hidden",
				userFilter: userFilter as "all" | "user" | "other",
				selectionFilter: selectionFilter as "all" | "selected" | "unselected",
				sortBy,
				sortOrder
			};
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
						setSelectionFilter(String(value) as "all" | "selected" | "unselected");
						break;
					case "dateFilter":
						setDateFilter((String(value) as "all" | "today" | "week" | "month") || "all");
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
						setSelectionFilter(String(value) as "all" | "selected" | "unselected");
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
		return Array.from(new Set(names.map((n: NameItem) => n.category || "Uncategorized"))).filter(
			Boolean,
		) as string[];
	}, [names]);

	return {
		names,
		isLoading,
		isError,
		error: isError ? (dataError as Error) : null,
		dataError: dataError as Error | null,
		refetch,
		clearErrors,

		selectedNames,
		selectedIds,
		isSelectionMode: false,
		setIsSelectionMode: () => {
			// Intentional no-op: selection mode not used in this context
		},
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		clearSelection,
		selectAll: _selectAll,
		isSelected,
		selectedCount,

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

		// Additional properties
		categories: uniqueCategories,
		profileProps,
		tournamentProps,
	};
}
