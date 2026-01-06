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
