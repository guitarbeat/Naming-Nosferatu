/**
 * @module useAppHooks
 * @description Consolidated shared hooks for admin status
 * 
 * NOTE: useToast has been moved to ToastProvider for context-based state management.
 * Import useToast from "@/shared/providers" or "@/shared/providers/ToastProvider".
 */

import { useEffect, useState } from "react";
import { isUserAdmin } from "../../features/auth/utils/authUtils";

// ============================================================================
// Admin Status Hook
// ============================================================================

/**
 * Custom hook for checking if a user is an admin
 * @param {string} userName - User name to check
 * @returns {Object} { isAdmin, isLoading, error }
 */
export function useAdminStatus(userName: string | null) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		let isMounted = true;

		const checkAdminStatus = async () => {
			if (!userName) {
				if (isMounted) {
					setIsAdmin(false);
					setIsLoading(false);
				}
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const adminStatus = await isUserAdmin(userName);
				if (isMounted) {
					setIsAdmin(adminStatus);
				}
			} catch (err) {
				if (isMounted) {
					if (process.env.NODE_ENV === "development") {
						console.error("Error checking admin status:", err);
					}
					setIsAdmin(false);
					setError(err);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		checkAdminStatus();

		return () => {
			isMounted = false;
		};
	}, [userName]);

	return { isAdmin, isLoading, error };
}
