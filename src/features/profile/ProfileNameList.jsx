import React, { useMemo, useEffect, memo } from "react";
import PropTypes from "prop-types";
import { SkeletonLoader, NameGrid } from "../../shared/components";
import { FILTER_OPTIONS, TOURNAMENT } from "../../core/constants";
import ProfileDashboard from "../../shared/components/ProfileDashboard/ProfileDashboard";
import { ProfileFilters } from "./components/ProfileFilters";
import { ProfileBulkActions } from "./components/ProfileBulkActions";
import styles from "./ProfileNameList.refactored.module.css";

/**
 * @module ProfileNameList
 * @description Displays the filtered and sorted list of names in the profile view.
 * Extracted from Profile component for better separation of concerns.
 */

const ProfileNameList = ({
  names = [],
  ratings = {},
  isLoading = false,
  filterStatus,
  setFilterStatus,
  userFilter,
  setUserFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  isAdmin = false,
  onToggleVisibility,
  onDelete,
  onSelectionChange,
  selectedNames = new Set(),
  hiddenIds = new Set(),
  className = "",
  selectionFilter,
  setSelectionFilter,
  selectionStats,
  onBulkHide,
  onBulkUnhide,
  onFilteredCountChange,
  onApplyFilters: _onApplyFilters,
  stats,
  highlights,
  filteredCount,
  totalCount,
  showUserFilter = true,
  hideSelectAllButton = false,
  onSelectAllClick,
  userSelectOptions,
}) => {
  const currentUserName = ratings?.userName ?? "";

  // * Filter and sort names based on current filters
  const filteredAndSortedNames = useMemo(() => {
    if (!names || names.length === 0) return [];

    let filtered = names;

    const isNameHidden = (n) => Boolean(n.isHidden) || hiddenIds.has(n.id);

    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 ProfileNameList filtering:", {
        totalNames: names.length,
        filterStatus,
        userFilter,
        sortBy,
        sortOrder,
        selectionFilter,
        hiddenIdsCount: hiddenIds.size,
        hiddenNamesInData: names.filter((n) => n.isHidden).length,
      });
    }

    // * Apply status filter
    if (filterStatus === FILTER_OPTIONS.STATUS.ACTIVE) {
      filtered = filtered.filter((name) => !isNameHidden(name));
    } else if (filterStatus === FILTER_OPTIONS.STATUS.HIDDEN) {
      filtered = filtered.filter((name) => isNameHidden(name));
    }

    // * Apply user filter
    // Only apply user filter if user_name exists on items
    if (userFilter) {
      const nameMatchesOwner = (name, owner) => {
        const nameOwner = name.owner ?? currentUserName;
        return owner ? nameOwner === owner : false;
      };

      if (userFilter === FILTER_OPTIONS.USER.CURRENT) {
        filtered = filtered.filter((name) =>
          nameMatchesOwner(name, currentUserName),
        );
      } else if (userFilter === FILTER_OPTIONS.USER.OTHER) {
        filtered = filtered.filter((name) => {
          const nameOwner = name.owner ?? currentUserName;
          return nameOwner && nameOwner !== currentUserName;
        });
      } else if (userFilter !== FILTER_OPTIONS.USER.ALL) {
        filtered = filtered.filter((name) =>
          nameMatchesOwner(name, userFilter),
        );
      }
    }

    // * NEW: Apply selection-based filters
    if (selectionFilter !== "all" && selectionStats) {
      switch (selectionFilter) {
        case "selected":
          // Filter to names that have been selected at least once
          filtered = filtered.filter((name) => {
            const selectionCount =
              selectionStats.nameSelectionCounts?.[name.id] || 0;
            return selectionCount > 0;
          });
          break;
        case "never_selected":
          // Filter to names that have never been selected
          filtered = filtered.filter((name) => {
            const selectionCount =
              selectionStats.nameSelectionCounts?.[name.id] || 0;
            return selectionCount === 0;
          });
          break;
        case "frequently_selected": {
          // Filter to names selected more than average
          const avgSelections = selectionStats.avgSelectionsPerName || 0;
          filtered = filtered.filter((name) => {
            const selectionCount =
              selectionStats.nameSelectionCounts?.[name.id] || 0;
            return selectionCount > avgSelections;
          });
          break;
        }
        case "recently_selected": {
          // Filter to names selected in the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filtered = filtered.filter((name) => {
            const lastSelected = selectionStats.nameLastSelected?.[name.id];
            return lastSelected && new Date(lastSelected) > thirtyDaysAgo;
          });
          break;
        }
        default:
          break;
      }
    }

    // * Sort names - Enhanced with selection-based sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case FILTER_OPTIONS.SORT.RATING:
          aValue = a.user_rating || TOURNAMENT.DEFAULT_RATING;
          bValue = b.user_rating || TOURNAMENT.DEFAULT_RATING;
          break;
        case FILTER_OPTIONS.SORT.NAME:
          aValue = (a?.name || "").toLowerCase();
          bValue = (b?.name || "").toLowerCase();
          break;
        case FILTER_OPTIONS.SORT.WINS:
          aValue = a.user_wins || 0;
          bValue = b.user_wins || 0;
          break;
        case FILTER_OPTIONS.SORT.LOSSES:
          aValue = a.user_losses || 0;
          bValue = b.user_losses || 0;
          break;
        case FILTER_OPTIONS.SORT.WIN_RATE: {
          const aTotal = (a.user_wins || 0) + (a.user_losses || 0);
          const bTotal = (b.user_wins || 0) + (b.user_losses || 0);
          aValue = aTotal > 0 ? (a.user_wins || 0) / aTotal : 0;
          bValue = bTotal > 0 ? (b.user_wins || 0) / bTotal : 0;
          break;
        }
        case FILTER_OPTIONS.SORT.CREATED:
          aValue = new Date(a.created_at || 0);
          bValue = new Date(b.created_at || 0);
          break;
        // * NEW: Selection-based sorting options
        case "selection_count":
          aValue = selectionStats?.nameSelectionCounts?.[a.id] || 0;
          bValue = selectionStats?.nameSelectionCounts?.[b.id] || 0;
          break;
        case "last_selected":
          aValue = selectionStats?.nameLastSelected?.[a.id]
            ? new Date(selectionStats.nameLastSelected[a.id])
            : new Date(0);
          bValue = selectionStats?.nameLastSelected?.[b.id]
            ? new Date(selectionStats.nameLastSelected[b.id])
            : new Date(0);
          break;
        case "selection_frequency":
          aValue = selectionStats?.nameSelectionFrequency?.[a.id] || 0;
          bValue = selectionStats?.nameSelectionFrequency?.[b.id] || 0;
          break;
        case "tournament_appearances":
          aValue = a.total_tournaments || 0;
          bValue = b.total_tournaments || 0;
          break;
        default:
          aValue = a.user_rating || TOURNAMENT.DEFAULT_RATING;
          bValue = b.user_rating || TOURNAMENT.DEFAULT_RATING;
      }

      // * Handle string comparison
      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortOrder === FILTER_OPTIONS.ORDER.ASC) {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }

      // * Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        if (sortOrder === FILTER_OPTIONS.ORDER.ASC) {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // * Handle numeric comparison
      if (sortOrder === FILTER_OPTIONS.ORDER.ASC) {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    // Debug logging after filtering
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 After filtering:", {
        filteredCount: filtered.length,
        originalCount: names.length,
      });
    }

    return filtered;
  }, [
    names,
    filterStatus,
    userFilter,
    sortBy,
    sortOrder,
    currentUserName,
    selectionFilter,
    selectionStats,
    hiddenIds,
  ]);

  // * Report filtered count to parent component
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredAndSortedNames.length);
    }
  }, [filteredAndSortedNames.length, onFilteredCountChange]);

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLoader key={index} height={120} />
          ))}
        </div>
      </div>
    );
  }

  if (filteredAndSortedNames.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No names found</h3>
          <p className={styles.emptyMessage}>
            {filterStatus !== FILTER_OPTIONS.STATUS.ALL ||
            userFilter !== FILTER_OPTIONS.USER.ALL
              ? "Try adjusting your filters to see more names."
              : "Start by creating your first tournament!"}
          </p>
        </div>
      </div>
    );
  }

  // * Handle select all functionality
  const handleSelectAll = () => {
    const allVisibleIds = filteredAndSortedNames.map((name) => name.id);
    const allSelected = allVisibleIds.every((id) => selectedNames.has(id));

    if (allSelected) {
      // Deselect all visible names
      allVisibleIds.forEach((id) => onSelectionChange?.(id, false));
    } else {
      // Select all visible names
      allVisibleIds.forEach((id) => onSelectionChange?.(id, true));
    }
  };

  // * Handle bulk hide/unhide
  const handleBulkHide = () => {
    const selectedIds = Array.from(selectedNames);
    onBulkHide?.(selectedIds);
  };

  const handleBulkUnhide = () => {
    const selectedIds = Array.from(selectedNames);
    onBulkUnhide?.(selectedIds);
  };

  // * Check if all visible names are selected
  const allVisibleSelected =
    filteredAndSortedNames.length > 0 &&
    filteredAndSortedNames.every((name) => selectedNames.has(name.id));

  // * Filter options - removed, now in ProfileFilters component

  return (
    <div className={`${styles.container} ${className}`}>
      {stats && (
        <ProfileDashboard
          stats={stats}
          selectionStats={selectionStats}
          highlights={highlights}
        />
      )}

      {/* Filters */}
      <ProfileFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectionFilter={selectionFilter}
        setSelectionFilter={setSelectionFilter}
        showUserFilter={showUserFilter}
        showSelectionFilter={!!selectionStats}
        userSelectOptions={userSelectOptions}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {/* Bulk Actions */}
      {isAdmin && filteredAndSortedNames.length > 0 && (
        <ProfileBulkActions
          selectedCount={selectedNames.size}
          onSelectAll={onSelectAllClick || handleSelectAll}
          onDeselectAll={onSelectAllClick || handleSelectAll}
          onBulkHide={handleBulkHide}
          onBulkUnhide={handleBulkUnhide}
          isAllSelected={allVisibleSelected}
          showActions={!hideSelectAllButton}
        />
      )}

      {/* Names Grid - Using Unified Component */}
      <NameGrid
        names={filteredAndSortedNames}
        selectedNames={selectedNames}
        onToggleName={onSelectionChange}
        filters={{
          // Pass empty filters since filtering is already done
          category: null,
          searchTerm: "",
          sortBy: "",
        }}
        mode="profile"
        isLoading={false}
        isAdmin={isAdmin}
        showSelectedOnly={false}
        hiddenIds={hiddenIds}
        onToggleVisibility={onToggleVisibility}
        onDelete={onDelete}
        className={styles.namesGrid}
      />
    </div>
  );
};

ProfileNameList.propTypes = {
  names: PropTypes.array,
  ratings: PropTypes.object,
  isLoading: PropTypes.bool,
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
  userFilter: PropTypes.string.isRequired,
  setUserFilter: PropTypes.func.isRequired,
  sortBy: PropTypes.string.isRequired,
  setSortBy: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  setSortOrder: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
  onToggleVisibility: PropTypes.func,
  onDelete: PropTypes.func,
  onSelectionChange: PropTypes.func,
  selectedNames: PropTypes.instanceOf(Set),
  className: PropTypes.string,
  selectionFilter: PropTypes.string,
  setSelectionFilter: PropTypes.func,
  selectionStats: PropTypes.object,
  onBulkHide: PropTypes.func,
  onBulkUnhide: PropTypes.func,
  onFilteredCountChange: PropTypes.func,
  onApplyFilters: PropTypes.func,
  stats: PropTypes.object,
  highlights: PropTypes.object,
  filteredCount: PropTypes.number,
  totalCount: PropTypes.number,
  showUserFilter: PropTypes.bool,
  userSelectOptions: PropTypes.array,
};

export default memo(ProfileNameList);
