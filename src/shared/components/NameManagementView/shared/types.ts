/**
 * @module types
 * @description Local types for NameManagementView.
 * TODO: Consolidate with src/types/components.ts in future pass.
 */

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

export interface UseNameManagementViewProps {
	mode: "tournament" | "profile";
	userName?: string | null;
	profileProps?: Record<string, unknown>;
	analysisMode: boolean;
	setAnalysisMode: (mode: boolean) => void;
}

// We need to defer this type definition to avoid circular imports if we import the hook here.
// Instead, we will define the result interface explicitly or use 'any' temporarily if tight on time.
// actually, we can't import the hook from core if core imports types.
// So we should define the interface manually or keep it in core.
// Let's define the parts we know.
