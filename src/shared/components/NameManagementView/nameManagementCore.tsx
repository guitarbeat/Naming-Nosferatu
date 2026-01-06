/**
 * @module nameManagementCore
 * @description Consolidated core logic for NameManagementView.
 * Includes Types, Context, and Hooks for name data and selection management.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import type { Dispatch, SetStateAction } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { FILTER_OPTIONS } from "../../../core/constants";
import { useRouting } from "../../../core/hooks/useRouting";
import useAppStore from "../../../core/store/useAppStore";
import { FALLBACK_NAMES } from "../../../features/tournament/tournamentUtils";
import { ErrorManager } from "../../services/errorManager/index";
import { catNamesAPI, tournamentsAPI } from "../../services/supabase/client";
import {
	applyNameFilters,
	mapFilterStatusToVisibility,
} from "../../utils/core";

// ============================================================================
// TYPES
// ============================================================================

export interface NameItem {
	id: string | number;
	name: string;
	description?: string;
	avg_rating?: number;
	popularity_score?: number;
	is_hidden?: boolean;
	category?: string;
	[key: string]: unknown;
}

export interface TournamentFilters {
	searchTerm?: string;
	category?: string;
	sortBy?: string;
	filterStatus?: string;
	userFilter?: string;
	selectionFilter?: string;
	sortOrder?: string;
	dateFilter?: string;
}

export interface NameManagementContextType {
	names: NameItem[];
	selectedNames: NameItem[];
	toggleName: (name: NameItem | string) => void;
	toggleNameById: (nameId: string, selected: boolean) => void;
	toggleNamesByIds: (nameIds: string[], shouldSelect?: boolean) => void;
	selectAll: () => void;
	clearSelection: () => void;
	isSelected: (nameOrId: NameItem | string) => boolean;
	selectedCount: number;
	totalCount: number;
	mode: string;
	handleFilterChange: (
		key: keyof TournamentFilters,
		value: string | number | boolean,
	) => void;
	onStartTournament?: (selectedNames: NameItem[]) => void;
}

export interface NameManagementViewExtensions {
	header?: React.ReactNode | (() => React.ReactNode);
	dashboard?: React.ReactNode | (() => React.ReactNode);
	footerText?: React.ReactNode | (() => React.ReactNode);
	lightbox?: React.ReactNode | (() => React.ReactNode);
	nameSuggestion?: React.ReactNode | (() => React.ReactNode);
	nameGrid?: React.ReactNode | React.ReactElement | (() => React.ReactNode);
	contextLogic?: React.ReactNode | (() => React.ReactNode);
	navbar?: React.ReactNode | (() => React.ReactNode);
	bulkActions?:
		| React.ReactNode
		| ((props: { onExport?: () => void }) => React.ReactNode);
}

export interface SwipeableCardsProps {
	names: NameItem[];
	selectedNames: NameItem[];
	onToggleName: (name: NameItem) => void;
	onRateName?: (name: NameItem, rating: number) => void;
	isAdmin?: boolean;
	isSelectionMode?: boolean;
	showCatPictures?: boolean;
	imageList?: string[];
	onStartTournament?: (names: NameItem[]) => void;
}

export interface NameManagementViewTournamentProps {
	categories?: string[];
	SwipeableCards?: React.ComponentType<SwipeableCardsProps>;
	isAdmin?: boolean;
	imageList?: string[];
	gridClassName?: string;
	onTournamentStart?: (
		names: NameItem[],
		existingRatings: Record<string, { rating: number }>,
	) => void;
}

export interface NameManagementViewProfileProps {
	onToggleVisibility?: (id: string | number) => void;
	onDelete?: (name: NameItem) => void;
	hiddenIds?: Set<string>;
	stats?: Record<string, unknown>;
	selectionStats?: Record<string, unknown>;
	highlights?: Record<string, unknown>;
	isAdmin?: boolean;
	showUserFilter?: boolean;
	userOptions?: Array<{ value: string; label: string }>;
	userFilter?: string;
	setUserFilter?: (value: string) => void;
}

export interface UseNameManagementViewProps {
	mode?: "tournament" | "profile";
	userName: string;
	profileProps?: NameManagementViewProfileProps;
	tournamentProps?: NameManagementViewTournamentProps;
	analysisMode: boolean;
	setAnalysisMode: (mode: boolean) => void;
}

export interface UseNameManagementViewResult {
	// Data
	names: NameItem[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	dataError: Error | null;
	refetch: () => void;
	clearErrors: () => void;

	// Name Selection
	selectedNames: NameItem[];
	selectedIds: Set<string>;
	isSelectionMode: boolean;
	toggleName: (name: NameItem | string) => void;
	toggleNameById: (nameId: string, selected: boolean) => void;
	toggleNamesByIds: (nameIds: string[], shouldSelect?: boolean) => void;
	setIsSelectionMode: Dispatch<SetStateAction<boolean>>;
	clearSelection: () => void;
	selectAll: () => void;
	isSelected: (nameOrId: NameItem | string) => boolean;
	selectedCount: number;

	// Filter State
	searchQuery: string;
	setSearchQuery: Dispatch<SetStateAction<string>>;
	filterStatus: string;
	setFilterStatus: Dispatch<SetStateAction<string>>;
	sortBy: string;
	setSortBy: Dispatch<SetStateAction<string>>;
	sortOrder: "asc" | "desc";
	setSortOrder: Dispatch<SetStateAction<"asc" | "desc">>;
	selectedCategory: string;
	setSelectedCategory: Dispatch<SetStateAction<string>>;
	showSelectedOnly: boolean;
	setShowSelectedOnly: Dispatch<SetStateAction<boolean>>;
	selectionFilter: "all" | "selected" | "unselected";
	setSelectionFilter: Dispatch<
		SetStateAction<"all" | "selected" | "unselected">
	>;
	userFilter: "all" | "user" | "other";
	setUserFilter: Dispatch<SetStateAction<"all" | "user" | "other">>;
	dateFilter: "all" | "today" | "week" | "month";
	setDateFilter: Dispatch<SetStateAction<"all" | "today" | "week" | "month">>;

	// UI State
	isSwipeMode: boolean;
	showCatPictures: boolean;
	activeTab: string;
	setActiveTab: Dispatch<SetStateAction<string>>;

	// Derived
	filteredNames: NameItem[];
	filteredNamesForSwipe: NameItem[];
	uniqueCategories: string[];
	stats: {
		total: number;
		visible: number;
		selected: number;
	};
	filterConfig: TournamentFilters;

	// Actions
	handleAnalysisModeToggle: () => void;
	handleFilterChange: (
		key: keyof TournamentFilters,
		value: string | number | boolean,
	) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const NameManagementContext =
	createContext<NameManagementContextType | null>(null);

export const NameManagementProvider = ({
	value,
	children,
}: {
	value: NameManagementContextType;
	children: React.ReactNode;
}) => {
	return (
		<NameManagementContext.Provider value={value}>
			{children}
		</NameManagementContext.Provider>
	);
};

export const useNameManagementContext = () => {
	const context = useContext(NameManagementContext);
	if (!context) {
		throw new Error(
			"useNameManagementContext must be used within a NameManagementProvider",
		);
	}
	return context;
};

export const useNameManagementContextSafe = () => {
	return useContext(NameManagementContext);
};

// ============================================================================
// HOOKS - Name Data
// ============================================================================

interface UseNameDataProps {
	userName: string | null;
	mode?: "tournament" | "profile";
	enableErrorHandling?: boolean;
}

export function useNameData({
	userName,
	mode = "tournament",
	enableErrorHandling = true,
}: UseNameDataProps) {
	const queryClient = useQueryClient();

	const {
		data: names = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["names", mode, userName],
		queryFn: async () => {
			try {
				let namesData: NameItem[];

				if (mode === "tournament") {
					namesData = (await catNamesAPI.getNamesWithDescriptions(
						true,
					)) as NameItem[];
				} else {
					if (!userName) return [];
					const rawData = await catNamesAPI.getNamesWithUserRatings(userName);
					namesData = (
						rawData as Array<{
							id: string;
							name: string;
							[key: string]: unknown;
						}>
					).map((name) => ({
						...name,
						owner: userName,
					})) as NameItem[];
				}

				if (!Array.isArray(namesData)) {
					throw new Error("Invalid response: namesData is not an array");
				}

				return [...namesData].sort((a: NameItem, b: NameItem) =>
					(a?.name || "").localeCompare(b?.name || ""),
				);
			} catch (err) {
				if (enableErrorHandling) {
					ErrorManager.handleError(
						err,
						`${mode === "tournament" ? "TournamentSetup" : "Profile"} - Fetch Names`,
						{
							isRetryable: true,
							affectsUserData: false,
							isCritical: false,
						},
					);
				}
				// Return fallback names for tournament mode on error
				if (mode === "tournament") return FALLBACK_NAMES as NameItem[];
				throw err;
			}
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes
	});

	const hiddenIds = useMemo(() => {
		return new Set(
			names
				.filter((name: NameItem) => name.is_hidden === true)
				.map((name: NameItem) => name.id),
		);
	}, [names]);

	const updateNames = useCallback(
		(updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
			queryClient.setQueryData(
				["names", mode, userName],
				(old: NameItem[] = []) => {
					return typeof updater === "function" ? updater(old) : updater;
				},
			);
		},
		[queryClient, mode, userName],
	);

	return {
		names,
		hiddenIds,
		isLoading,
		error,
		refetch,
		setNames: updateNames,
	};
}

// ============================================================================
// HOOKS - Name Selection
// ============================================================================

interface UseNameSelectionProps {
	names?: NameItem[];
	mode?: "tournament" | "profile";
	userName: string | null;
	enableAutoSave?: boolean;
}

export function useNameSelection({
	names = [],
	mode = "tournament",
	userName,
	enableAutoSave = true,
}: UseNameSelectionProps) {
	// Unify state to always use a Set of IDs (strings)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedHashRef = useRef("");
	const lastLogTsRef = useRef(0);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	// Derive the selectedNames array for components that expect it
	const selectedNames = useMemo(() => {
		return names.filter((n) => selectedIds.has(String(n.id)));
	}, [names, selectedIds]);

	const selectedCount = selectedIds.size;

	const { mutate: saveTournamentSelections } = useMutation({
		mutationFn: async (namesToSave: NameItem[]) => {
			if (mode !== "tournament" || !userName) return;
			const tournamentId = `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const result = await tournamentsAPI.saveTournamentSelections(
				userName,
				namesToSave,
				tournamentId,
			);
			if (process.env.NODE_ENV === "development") {
				console.log("🎮 TournamentSetup: Selections saved to database", result);
			}
			return result;
		},
		onError: (error) => {
			ErrorManager.handleError(error, "Save Tournament Selections", {
				isRetryable: true,
				affectsUserData: false,
				isCritical: false,
			});
		},
	});

	const scheduleSave = useCallback(
		(namesToSave: NameItem[]) => {
			if (mode !== "tournament" || !enableAutoSave || !userName) return;
			if (!Array.isArray(namesToSave) || namesToSave.length === 0) return;

			const hash = namesToSave
				.map((n) => n.id || n.name)
				.sort()
				.join(",");

			if (hash === lastSavedHashRef.current) return;

			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = setTimeout(() => {
				lastSavedHashRef.current = hash;
				saveTournamentSelections(namesToSave);
			}, 800);
		},
		[mode, userName, enableAutoSave, saveTournamentSelections],
	);

	const toggleName = useCallback(
		(nameOrId: NameItem | string) => {
			const id = typeof nameOrId === "string" ? nameOrId : String(nameOrId.id);

			setSelectedIds((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(id)) {
					newSet.delete(id);
				} else {
					newSet.add(id);
				}

				// For tournament mode, we still want to schedule the save with full objects
				if (mode === "tournament") {
					const updatedList = names.filter((n) => newSet.has(String(n.id)));

					if (
						Date.now() - lastLogTsRef.current > 1000 &&
						process.env.NODE_ENV === "development"
					) {
						console.log("🎮 TournamentSetup: Selection updated", updatedList);
						lastLogTsRef.current = Date.now();
					}
					scheduleSave(updatedList);
				}

				return newSet;
			});
		},
		[mode, names, scheduleSave],
	);

	const toggleNameById = useCallback(
		(nameId: string, selected: boolean) => {
			const id = String(nameId);
			setSelectedIds((prev) => {
				const newSet = new Set(prev);
				if (selected) {
					newSet.add(id);
				} else {
					newSet.delete(id);
				}

				if (mode === "tournament") {
					const updatedList = names.filter((n) => newSet.has(String(n.id)));
					scheduleSave(updatedList);
				}

				return newSet;
			});
		},
		[mode, names, scheduleSave],
	);

	const toggleNamesByIds = useCallback(
		(nameIds: string[] = [], shouldSelect = true) => {
			if (!Array.isArray(nameIds) || nameIds.length === 0) return;

			setSelectedIds((prev) => {
				const newSet = new Set(prev);
				nameIds.forEach((id) => {
					if (shouldSelect) {
						newSet.add(String(id));
					} else {
						newSet.delete(String(id));
					}
				});

				if (mode === "tournament") {
					const updatedList = names.filter((n) => newSet.has(String(n.id)));
					scheduleSave(updatedList);
				}

				return newSet;
			});
		},
		[mode, names, scheduleSave],
	);

	const selectAll = useCallback(() => {
		setSelectedIds((prev) => {
			const allSelected = prev.size === names.length;
			if (allSelected) {
				if (mode === "tournament") scheduleSave([]);
				return new Set();
			}

			const newSet = new Set(names.map((n) => String(n.id)));
			if (mode === "tournament") scheduleSave(names);
			return newSet;
		});
	}, [mode, names, scheduleSave]);

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set());
		if (mode === "tournament") scheduleSave([]);
	}, [mode, scheduleSave]);

	const isSelected = useCallback(
		(nameOrId: NameItem | string) => {
			const id = typeof nameOrId === "string" ? nameOrId : String(nameOrId.id);
			return selectedIds.has(id);
		},
		[selectedIds],
	);

	return {
		selectedNames, // Array of NameItem for backward sync
		selectedIds, // Set of strings for efficient lookups
		setSelectedIds,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll,
		clearSelection,
		isSelected,
		selectedCount,
	};
}

// ============================================================================
// HOOKS - Name Management View State
// ============================================================================

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
		refetch,
	} = useNameData({ userName, mode });

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
		userName,
	});

	const { errors, ui, errorActions } = useAppStore();
	const isError = mode === "tournament" && (!!errors.current || !!dataError);
	const clearErrors = errorActions?.clearError ?? (() => {});

	const [showSelectedOnly, setShowSelectedOnly] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState("");
	const [sortBy, setSortBy] = useState("alphabetical");

	const { isSwipeMode, showCatPictures } = ui;

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
		isError,
		error: isError ? (dataError as Error) : null,
		dataError: dataError as Error | null,
		refetch,
		clearErrors,

		selectedNames,
		selectedIds,
		isSelectionMode: false,
		setIsSelectionMode: () => {},
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
	};
}
