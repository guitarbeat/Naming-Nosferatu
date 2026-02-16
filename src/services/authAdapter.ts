/**
 * @module authAdapter
 * @description Simple authentication adapter for the naming tournament app.
 *
 * This is a basic auth implementation that recognizes "Aaron" as an admin
 * and treats any other username as a regular user. No real authentication
 * - just username-based role detection for demo purposes.
 */

import type { AuthAdapter, AuthUser, LoginCredentials } from "@/app/providers/Providers";

// Simple admin usernames - can be expanded as needed
const ADMIN_USERNAMES = ["Aaron", "admin", "administrator"];

export const authAdapter: AuthAdapter = {
	/**
	 * Get current user from localStorage or return null
	 */
	async getCurrentUser(): Promise<AuthUser | null> {
		if (typeof window === "undefined") {
			return null;
		}

		const userName = localStorage.getItem("userName");
		if (!userName) {
			return null;
		}

		const isAdmin = ADMIN_USERNAMES.some((admin) => admin.toLowerCase() === userName.toLowerCase());
		console.log(`[AuthAdapter] User: ${userName}, IsAdmin: ${isAdmin}`);

		return {
			id: userName,
			name: userName,
			email: undefined,
			isAdmin: isAdmin,
			role: isAdmin ? "admin" : "user",
		};
	},

	/**
	 * Login with username (simple implementation)
	 */
	async login(credentials: LoginCredentials): Promise<boolean> {
		const userName = credentials.name?.trim();
		if (!userName) {
			return false;
		}

		// Store username in localStorage
		localStorage.setItem("userName", userName);
		return true;
	},

	/**
	 * Logout - clear stored user data
	 */
	async logout(): Promise<void> {
		if (typeof window !== "undefined") {
			localStorage.removeItem("userName");
		}
	},

	/**
	 * Register - not implemented in this simple auth system
	 */
	async register(): Promise<void> {
		// No-op for this simple implementation
		throw new Error("Registration not implemented in this demo auth system");
	},

	/**
	 * Check if a user is admin based on username
	 */
	async checkAdminStatus(userIdOrName: string): Promise<boolean> {
		return ADMIN_USERNAMES.includes(userIdOrName);
	},
};
