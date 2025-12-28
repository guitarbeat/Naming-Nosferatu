/**
 * @module TournamentToolbar/config
 * @description Consolidated configuration for TournamentToolbar component
 * Includes glass configs, CSS class mappings, and filter configurations
 */

import { FILTER_OPTIONS } from "../../../core/constants";

// ============================================================================
// LiquidGlass Configurations
// ============================================================================

export const TOOLBAR_GLASS_CONFIGS = {
  tournament: {
    width: 650,
    height: 80,
    radius: 20,
    scale: -180,
    saturation: 1.2,
    frost: 0.08,
    inputBlur: 12,
    outputBlur: 0.8,
  },
  filter: {
    width: 1200,
    height: 300,
    radius: 24,
    scale: -180,
    saturation: 1.2,
    frost: 0.08,
    inputBlur: 12,
    outputBlur: 0.8,
  },
};

// ============================================================================
// CSS Class Name Mappings
// ============================================================================

/**
 * Styles mapping object to avoid repeating 'tournament-toolbar-' prefix
 * Maps short names to full CSS class names
 */
export const styles = {
  unifiedContainer: "tournament-toolbar-unified-container",
  toggleStack: "tournament-toolbar-toggle-stack",
  filtersContainer: "tournament-toolbar-filters-container",
  startButton: "tournament-toolbar-start-button",
  toggleWrapper: "tournament-toolbar-toggle-wrapper",
  toggleSwitch: "tournament-toolbar-toggle-switch",
  toggleSwitchActive: "tournament-toolbar-toggle-switch-active",
  toggleThumb: "tournament-toolbar-toggle-thumb",
  toggleLabel: "tournament-toolbar-toggle-label",
  resultsCount: "tournament-toolbar-results-count",
  count: "tournament-toolbar-count",
  separator: "tournament-toolbar-separator",
  total: "tournament-toolbar-total",
  badge: "tournament-toolbar-badge",
  badgeTotal: "tournament-toolbar-badge-total",
  filtersGrid: "tournament-toolbar-filters-grid",
  filterRow: "tournament-toolbar-filter-row",
  filterGroup: "tournament-toolbar-filter-group",
  sortGroup: "tournament-toolbar-sort-group",
  filterLabel: "tournament-toolbar-filter-label",
  filterSelect: "tournament-toolbar-filter-select",
  sortControls: "tournament-toolbar-sort-controls",
  sortOrderButton: "tournament-toolbar-sort-order-button",
  sortIcon: "tournament-toolbar-sort-icon",
  suggestButton: "tournament-toolbar-suggest-button",
};

// ============================================================================
// Filter Configurations
// ============================================================================

export const FILTER_CONFIGS = {
  visibility: [
    { value: "all", label: "All Names" },
    { value: "visible", label: "Visible Only" },
    { value: "hidden", label: "Hidden Only" },
  ],
  users: [
    { value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
    { value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
    { value: FILTER_OPTIONS.USER.OTHER, label: "Other Users" },
  ],
  sort: [
    { value: FILTER_OPTIONS.SORT.RATING, label: "Rating" },
    { value: FILTER_OPTIONS.SORT.NAME, label: "Name" },
    { value: FILTER_OPTIONS.SORT.WINS, label: "Wins" },
    { value: FILTER_OPTIONS.SORT.LOSSES, label: "Losses" },
    { value: FILTER_OPTIONS.SORT.WIN_RATE, label: "Win Rate" },
    { value: FILTER_OPTIONS.SORT.CREATED, label: "Created" },
  ],
  selection: [
    { value: "all", label: "All Names" },
    { value: "selected", label: "Ever Selected" },
    { value: "never_selected", label: "Never Selected" },
    { value: "frequently_selected", label: "Frequently Selected" },
    { value: "recently_selected", label: "Recently Selected" },
  ],
  date: [
    { value: "all", label: "All Dates" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
  ],
};

