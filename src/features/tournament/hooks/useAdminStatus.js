/**
 * @module TournamentSetup/hooks/useAdminStatus
 * @description Re-exports shared useAdminStatus hook for backward compatibility.
 * @deprecated Import from '@/shared/hooks' instead
 */
import { useAdminStatus as useSharedAdminStatus } from "../../../shared/hooks";

/**
 * Custom hook for checking if the current user is an admin
 * @param {string} userName - Current user name
 * @returns {boolean} Admin status (for backward compatibility)
 */
export function useAdminStatus(userName) {
  const { isAdmin } = useSharedAdminStatus(userName);
  return isAdmin;
}
