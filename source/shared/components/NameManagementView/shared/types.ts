/**
 * @module types
 * @description Local types for NameManagementView.
 * Note: NameItem is now consolidated in src/types/components.ts
 */

import type { NameManagementViewExtensions } from "../nameManagementCore";

export interface TournamentFilters {
  searchTerm?: string;
  category?: string;
  sortBy?: string;
  filterStatus?: "all" | "visible" | "hidden";
  userFilter?: string;
  selectionFilter?: string;
  sortOrder?: "asc" | "desc";
  dateFilter?: string;
}

export interface UseNameManagementViewProps {
  mode: "tournament" | "profile";
  userName?: string | null;
  profileProps?: Record<string, unknown>;
  tournamentProps?: Record<string, unknown>;
  analysisMode: boolean;
  setAnalysisMode: (mode: boolean) => void;
  extensions?: NameManagementViewExtensions;
}

// We need to defer this type definition to avoid circular imports if we import the hook here.
// Instead, we will define the result interface explicitly or use 'any' temporarily if tight on time.
// actually, we can't import the hook from core if core imports types.
// So we should define the interface manually or keep it in core.
// Let's define the parts we know.
