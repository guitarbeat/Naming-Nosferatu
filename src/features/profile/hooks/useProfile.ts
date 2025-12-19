/**
 * @module useProfile
 * @description Consolidated hook for managing profile state, user context, and operations.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { FILTER_OPTIONS } from "../../../core/constants";
import { useAdminStatus } from "../../../shared/hooks/useAdminStatus";
import { NameItem, IdType } from "../../../shared/propTypes";
import { clearAllCaches, devLog, devError } from "../../../shared/utils/coreUtils";
import {
    fetchUserStats,
    calculateSelectionStats,
    listAllUsers,
    toggleNameVisibility,
    bulkNameVisibility,
    deleteProfileName,
    UserStats,
    SelectionStats,
    UserWithRoles,
} from "./profileService";

/**
 * * Unified hook for all profile functionality
 */
export function useProfile(userName: string, {
    showSuccess = (m: string) => devLog("Success:", m),
    showError = (m: string) => devError("Error:", m),
    fetchNames = (u: string) => devLog("Fetching names for:", u),
    setAllNames = (val: any) => { },
} = {}) {
    // ==========================================================================
    // User State (from useProfileUser)
    // ==========================================================================
    const { isAdmin } = useAdminStatus(userName);
    const [activeUser, setActiveUser] = useState<string | null>(userName);
    const [userFilter, setUserFilter] = useState(FILTER_OPTIONS.USER.CURRENT);
    const [availableUsers, setAvailableUsers] = useState<UserWithRoles[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);

    const canManageActiveUser = useMemo(
        () => isAdmin && activeUser === userName,
        [isAdmin, activeUser, userName],
    );

    // ==========================================================================
    // Stats State (from useProfileStats)
    // ==========================================================================
    const [stats, setStats] = useState<UserStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [selectionStats, setSelectionStats] = useState<SelectionStats | null>(null);
    const isMountedRef = useRef(true);

    // ==========================================================================
    // Operations State (from useProfileNameOperations)
    // ==========================================================================
    const [selectedNames, setSelectedNames] = useState<Set<IdType>>(new Set());
    const [hiddenNames, setHiddenNames] = useState<Set<IdType>>(new Set());

    // ==========================================================================
    // Effects & Loading Logic
    // ==========================================================================

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    // Sync activeUser with filter
    useEffect(() => {
        if (!userName) return;
        if (!isAdmin) {
            if (activeUser !== userName) setActiveUser(userName);
            return;
        }
        if (userFilter === FILTER_OPTIONS.USER.ALL) {
            if (activeUser !== null) setActiveUser(null);
        } else if (!userFilter || userFilter === FILTER_OPTIONS.USER.CURRENT) {
            if (activeUser !== userName) setActiveUser(userName);
        } else if (activeUser !== userFilter) {
            setActiveUser(userFilter);
        }
    }, [isAdmin, userFilter, activeUser, userName]);

    // Load stats when activeUser changes
    useEffect(() => {
        const loadData = async () => {
            setStatsLoading(true);
            try {
                const [userStats, selStats] = await Promise.all([
                    fetchUserStats(activeUser),
                    calculateSelectionStats(activeUser),
                ]);
                if (!isMountedRef.current) return;
                setStats(userStats);
                setSelectionStats(selStats);
            } catch (error) {
                devError("Failed to load profile data:", error);
            } finally {
                if (isMountedRef.current) setStatsLoading(false);
            }
        };
        void loadData();
    }, [activeUser]);

    // Load users for admin
    useEffect(() => {
        if (!isAdmin) return;
        const loadUsers = async () => {
            setUserListLoading(true);
            try {
                const users = await listAllUsers();
                if (!isMountedRef.current) return;
                setAvailableUsers(users);
            } finally {
                if (isMountedRef.current) setUserListLoading(false);
            }
        };
        void loadUsers();
    }, [isAdmin]);

    // ==========================================================================
    // Handlers (from useProfileNameOperations)
    // ==========================================================================

    const handleToggleVisibility = useCallback(async (nameId: string) => {
        if (!canManageActiveUser) return showError("Only admins can change visibility");
        try {
            const currentlyHidden = hiddenNames.has(nameId);
            const { success, error } = await toggleNameVisibility(userName, nameId, currentlyHidden);
            if (!success) throw new Error(error);

            showSuccess(currentlyHidden ? "Unhidden" : "Hidden");
            setHiddenNames(prev => {
                const next = new Set(prev);
                if (currentlyHidden) next.delete(nameId); else next.add(nameId);
                return next;
            });
            setAllNames((prev: NameItem[]) => prev.map(n => n.id === nameId ? { ...n, isHidden: !currentlyHidden } : n));
            clearAllCaches();
        } catch (e: any) {
            showError(`Failed to update visibility: ${e.message}`);
        }
    }, [canManageActiveUser, hiddenNames, userName, showSuccess, showError, setAllNames]);

    const handleDelete = useCallback(async (name: NameItem) => {
        if (!canManageActiveUser) return showError("Only admins can delete names");
        try {
            const { success, error } = await deleteProfileName(String(name.id));
            if (!success) throw new Error(error);
            showSuccess(`Deleted ${name.name}`);
            fetchNames(userName);
        } catch (e: any) {
            showError(`Failed to delete: ${e.message}`);
        }
    }, [canManageActiveUser, userName, showSuccess, showError, fetchNames]);

    const handleSelectionChange = useCallback((id: IdType, selected: boolean) => {
        setSelectedNames(prev => {
            const next = new Set(prev);
            if (selected) next.add(id); else next.delete(id);
            return next;
        });
    }, []);

    const handleBulkOperation = useCallback(async (isHide: boolean) => {
        if (!canManageActiveUser) return showError("Only admins can perform bulk operations");
        const ids = Array.from(selectedNames) as string[];
        if (ids.length === 0) return;

        try {
            const result = await bulkNameVisibility(userName, ids, isHide);
            if (result.success && (result.processed ?? 0) > 0) {
                showSuccess(`Successfully ${isHide ? "hidden" : "unhidden"} ${result.processed} names`);
                setHiddenNames(prev => {
                    const next = new Set(prev);
                    ids.forEach(id => isHide ? next.add(id) : next.delete(id));
                    return next;
                });
                setSelectedNames(new Set());
                clearAllCaches();
                fetchNames(userName);
            } else {
                showError(result.error || "Operation failed");
            }
        } catch (e: any) {
            showError(`Bulk operation failed: ${e.message}`);
        }
    }, [canManageActiveUser, selectedNames, userName, showSuccess, showError, fetchNames]);

    // ==========================================================================
    // Memoized Options
    // ==========================================================================

    const userOptions = useMemo(() => {
        const base = [
            { value: FILTER_OPTIONS.USER.ALL, label: isAdmin ? "All Users (Aggregate)" : "All Users" },
            { value: FILTER_OPTIONS.USER.CURRENT, label: isAdmin ? "Your Data" : "Current User" },
        ];
        if (!isAdmin) return base;

        const unique = new Map();
        availableUsers.forEach(u => {
            const role = u.user_roles?.[0]?.role;
            const badges: string[] = [];
            if (role && role !== "user") badges.push(role);
            if (u.user_name === userName) badges.push("you");
            const label = `${u.user_name}${badges.length ? ` (${badges.join(", ")})` : ""}`;
            unique.set(u.user_name, { value: u.user_name, label });
        });

        return [...base, ...Array.from(unique.values()).sort((a, b) => a.value.localeCompare(b.value))];
    }, [isAdmin, availableUsers, userName]);

    return {
        isAdmin, activeUser, userFilter, setUserFilter, canManageActiveUser, userOptions,
        stats, statsLoading, selectionStats,
        selectedNames, setSelectedNames, hiddenNames, setHiddenNames,
        handleToggleVisibility, handleDelete, handleSelectionChange, handleBulkHide: () => handleBulkOperation(true), handleBulkUnhide: () => handleBulkOperation(false),
    };
}
