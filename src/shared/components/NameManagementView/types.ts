import type React from "react";
import type { Dispatch, SetStateAction } from "react";

export interface NameItem {
	id: string | number;
	name: string;
	description?: string;
	avg_rating?: number;
	popularity_score?: number;
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
	toggleName: (name: NameItem) => void;
	toggleNameById: (nameId: string, selected: boolean) => void;
	toggleNamesByIds: (nameIds: string[], shouldSelect?: boolean) => void;
	selectAll: () => void;
	clearSelection: () => void;
	isSelected: (nameOrId: NameItem | string | number) => boolean;
	selectedCount: number;
	totalCount: number;
	mode: string;
	handleFilterChange: (name: string, value: string) => void;
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
}

export interface SwipeableCardsProps {
	names: NameItem[];
	selectedNames: NameItem[];
	onToggleName: (name: NameItem) => void;
	onRateName: (name: NameItem, rating: number) => void;
	isAdmin: boolean;
	isSelectionMode: boolean;
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
	error: Error | null;

	// Name Selection
	selectedNames: NameItem[];
	isSelectionMode: boolean;
	toggleName: (name: NameItem) => void;
	setIsSelectionMode: Dispatch<SetStateAction<boolean>>;
	clearSelection: () => void;
	selectAll: () => void;

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
