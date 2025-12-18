/**
 * @module useProfileUser
 * @description Custom hook for managing user state and admin status.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { FILTER_OPTIONS } from "../../../core/constants";
import { useAdminStatus } from "../../../shared/hooks/useAdminStatus";
import { adminAPI } from "../../../shared/services/supabase/api";

interface UserWithRoles {
  user_name: string;
  user_roles?: {
    role: string;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * * Hook for managing user state and admin functionality
 * @param {string} userName - Current user name
 * @returns {Object} User state and handlers
 */
export function useProfileUser(userName: string) {
  // * Use shared admin status hook
  const { isAdmin } = useAdminStatus(userName);

  const [activeUser, setActiveUser] = useState<string | null>(userName);
  const [userFilter, setUserFilter] = useState(FILTER_OPTIONS.USER.CURRENT);
  const [availableUsers, setAvailableUsers] = useState<UserWithRoles[]>([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState<unknown>(null);

  const canManageActiveUser = useMemo(
    () => isAdmin && activeUser === userName,
    [isAdmin, activeUser, userName],
  );

  const userOptions = useMemo(() => {
    if (!isAdmin) {
      return [
        { value: FILTER_OPTIONS.USER.ALL, label: "All Users" },
        { value: FILTER_OPTIONS.USER.CURRENT, label: "Current User" },
      ];
    }

    const options = [
      { value: FILTER_OPTIONS.USER.ALL, label: "All Users (Aggregate)" },
      { value: FILTER_OPTIONS.USER.CURRENT, label: "Your Data" },
    ];

    const uniqueUsers = new Map();

    availableUsers.forEach((user) => {
      if (!user?.user_name) return;

      const badges: string[] = [];
      // Get role from joined user_roles table
      const userRole = user.user_roles?.role;
      if (userRole && userRole !== "user") {
        badges.push(userRole);
      }
      if (user.user_name === userName) {
        badges.push("you");
      }

      const badgeText = badges.length ? ` (${badges.join(", ")})` : "";

      uniqueUsers.set(user.user_name, {
        value: user.user_name,
        label: `${user.user_name}${badgeText}`,
      });
    });

    if (activeUser && activeUser !== userName && !uniqueUsers.has(activeUser)) {
      uniqueUsers.set(activeUser, {
        value: activeUser,
        label: activeUser,
      });
    }

    if (userName && !uniqueUsers.has(userName)) {
      uniqueUsers.set(userName, {
        value: userName,
        label: `${userName} (you)`,
      });
    }

    const sorted = Array.from(uniqueUsers.values()).sort((a, b) =>
      a.value.localeCompare(b.value),
    );

    return [...options, ...sorted];
  }, [isAdmin, availableUsers, userName, activeUser]);

  // * Reset active user and filter when userName changes
  useEffect(() => {
    setActiveUser(userName || "");
    setUserFilter(FILTER_OPTIONS.USER.CURRENT);
  }, [userName]);

  // Update active user based on filter
  useEffect(() => {
    if (!userName) {
      return;
    }

    if (!isAdmin) {
      if (activeUser !== userName) {
        setActiveUser(userName);
      }
      return;
    }

    // * For admins: handle "all" filter specially (set to null for aggregate data)
    if (userFilter === FILTER_OPTIONS.USER.ALL) {
      if (activeUser !== null) {
        setActiveUser(null);
      }
      return;
    }

    if (!userFilter || userFilter === FILTER_OPTIONS.USER.CURRENT) {
      if (activeUser !== userName) {
        setActiveUser(userName);
      }
      return;
    }

    if (activeUser !== userFilter) {
      setActiveUser(userFilter);
    }
  }, [isAdmin, userFilter, activeUser, userName]);

  const loadAvailableUsers = useCallback(async () => {
    try {
      setUserListLoading(true);
      setUserListError(null);

      const users = await adminAPI.listUsers();
      const uniqueUsers = new Map();

      (users || []).forEach((user) => {
        if (user?.user_name) {
          uniqueUsers.set(user.user_name, user);
        }
      });

      if (userName) {
        const existing = uniqueUsers.get(userName);
        uniqueUsers.set(userName, {
          user_name: userName,
          user_roles: existing?.user_roles ?? null,
          created_at: existing?.created_at ?? null,
          updated_at: existing?.updated_at ?? null,
        });
      }

      const sortedUsers = Array.from(uniqueUsers.values()).sort((a, b) =>
        a.user_name.localeCompare(b.user_name),
      ) as UserWithRoles[];

      setAvailableUsers(sortedUsers);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading admin user list:", error);
      }
      setAvailableUsers([]);
      setUserListError(error as unknown);
    } finally {
      setUserListLoading(false);
    }
  }, [userName]);

  useEffect(() => {
    if (!isAdmin) {
      setAvailableUsers([]);
      setUserListLoading(false);
      setUserListError(null);
      return;
    }

    void loadAvailableUsers();
  }, [isAdmin, loadAvailableUsers]);

  return {
    isAdmin,
    activeUser,
    userFilter,
    setUserFilter,
    canManageActiveUser,
    userOptions,
    availableUsers,
    userListLoading,
    userListError,
  };
}
