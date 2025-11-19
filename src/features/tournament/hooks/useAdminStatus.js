/**
 * @module TournamentSetup/hooks/useAdminStatus
 * @description Custom hook for checking admin role status
 */
import { useState, useEffect } from "react";
import { isUserAdmin } from "../../../shared/utils/authUtils";

/**
 * Custom hook for checking if the current user is an admin
 * @param {string} userName - Current user name
 * @returns {boolean} Admin status
 */
export function useAdminStatus(userName) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userName) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminStatus = await isUserAdmin(userName);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [userName]);

  return isAdmin;
}
