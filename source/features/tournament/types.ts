import type React from "react";
import type { NameItem, TournamentFilters } from "@/types";
export type { NameItem, TournamentFilters };

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
 * Props for useNameManagementView hook
 */
export interface UseNameManagementViewProps {
	mode: "tournament" | "profile";
	userName?: string | null;
	profileProps?: Record<string, unknown>;
	tournamentProps?: Record<string, unknown>;
	analysisMode: boolean;
	setAnalysisMode: (mode: boolean) => void;
	extensions?: NameManagementViewExtensions;
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

/**
 * Hook return value type
 */
export interface UseNameManagementViewResult {
	// Core data
	names: NameItem[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	dataError: Error | null;
	refetch: () => Promise<unknown>;
	clearErrors: () => void;
	setNames: (updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => void;
	setHiddenIds: (ids: Set<string | number>) => void;

	// Selection state
	selectedNames: NameItem[];
	selectedIds: unknown;
	isSelectionMode: boolean;
	setIsSelectionMode: () => void;
	toggleName: (nameOrId: NameItem | string) => void;
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

	showSelectedOnly: boolean;
	setShowSelectedOnly: (show: boolean) => void;
	selectionFilter: string;
	setSelectionFilter: React.Dispatch<React.SetStateAction<"all" | "selected" | "unselected">>;
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
