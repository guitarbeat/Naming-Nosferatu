import type {
        AuthAdapter,
        AuthUser,
        LoginCredentials,
} from "@/app/providers/Providers";
import { STORAGE_KEYS } from "@/shared/lib/constants";
import { isStorageAvailable } from "@/shared/lib/storage";
import {
        clearStoredUserSnapshot,
        readStoredUserSnapshot,
        writeStoredUserSnapshot,
} from "@/shared/lib/userStorage";
import { resolveSupabaseClient } from "@/shared/services/supabase/runtime";

/**
 * Sanitize a user name to create a valid email local-part
 * Removes special characters, spaces, and converts to lowercase
 */
function sanitizeNameForEmail(name: string): string {
        return name
                .toLowerCase()
                .replace(/[^a-z0-9._-]/g, "") // Keep only alphanumeric, dots, underscores, hyphens
                .replace(/^[.-]+|[.-]+$/g, "") // Remove leading/trailing dots or hyphens
                .slice(0, 64); // Email local-part max length is 64 chars
}

function buildAuthUserFromStoredSnapshot(): AuthUser | null {
        const storedUser = readStoredUserSnapshot();
        if (!storedUser) {
                return null;
        }

        return {
                id: storedUser.id || storedUser.name,
                name: storedUser.name,
                email: storedUser.email,
                isAdmin: Boolean(storedUser.isAdmin),
                role: storedUser.isAdmin ? "admin" : "user",
        };
}

export const supabaseAuthAdapter: AuthAdapter = {
        /**
         * Get current user from Supabase auth or localStorage fallback
         */
        async getCurrentUser(): Promise<AuthUser | null> {
                if (!isStorageAvailable()) {
                        return null;
                }

                // Try to get current user from Supabase first
                try {
                        const client = await resolveSupabaseClient();
                        if (!client) {
                                return buildAuthUserFromStoredSnapshot();
                        }

                        const {
                                data: { user },
                        } = await client.auth.getUser();

                        if (!user) {
                                return null;
                        }

                        // Check if user has admin role
                        const isAdmin = await this.checkAdminStatus(user.id);
                        const authUser = {
                                id: user.id,
                                name: user.user_metadata?.user_name || user.email || "Unknown",
                                email: user.email,
                                isAdmin,
                                role: isAdmin ? "admin" : "user",
                        } satisfies AuthUser;

                        writeStoredUserSnapshot({
                                ...readStoredUserSnapshot(),
                                id: authUser.id,
                                name: authUser.name,
                                email: authUser.email,
                                isAdmin: authUser.isAdmin,
                        });

                        return authUser;
                } catch (error) {
                        console.error("Error getting current user:", error);
                        return null;
                }
        },

        /**
         * Login with Supabase Auth
         */
        async login(credentials: LoginCredentials): Promise<boolean> {
                const { name } = credentials;
                if (!name?.trim()) {
                        return false;
                }

                try {
                        const trimmedName = name.trim();
                        const client = await resolveSupabaseClient();
                        if (!client) {
                                // Fallback to localStorage for demo mode
                                const storedUser = readStoredUserSnapshot();
                                writeStoredUserSnapshot({
                                        ...storedUser,
                                        name: trimmedName,
                                        isAdmin:
                                                storedUser?.name === trimmedName ? storedUser.isAdmin : false,
                                });
                                return true;
                        }

                        const sanitizedEmail = `${sanitizeNameForEmail(trimmedName)}@demo.local`;
                        const DEMO_PASSWORD = "demo-password";

                        // Try signing in first; if no account exists, sign up automatically
                        let authUser: import("@supabase/supabase-js").User | null = null;

                        const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
                                email: sanitizedEmail,
                                password: DEMO_PASSWORD,
                        });

                        if (signInError) {
                                const isInvalidCredentials =
                                        signInError.message?.toLowerCase().includes("invalid login") ||
                                        signInError.message?.toLowerCase().includes("invalid credentials") ||
                                        signInError.status === 400;

                                if (!isInvalidCredentials) {
                                        console.error("Supabase login failed:", signInError);
                                        return false;
                                }

                                const { data: signUpData, error: signUpError } = await client.auth.signUp({
                                        email: sanitizedEmail,
                                        password: DEMO_PASSWORD,
                                        options: {
                                                data: { user_name: trimmedName },
                                        },
                                });

                                if (signUpError) {
                                        console.error("Supabase sign-up failed:", signUpError);
                                        return false;
                                }

                                authUser = signUpData.user;
                        } else {
                                authUser = signInData.user;
                        }

                        // Store user info in localStorage for compatibility
                        if (authUser) {
                                const storedUser = readStoredUserSnapshot();
                                writeStoredUserSnapshot({
                                        ...storedUser,
                                        id: authUser.id,
                                        name: authUser.user_metadata?.user_name || trimmedName,
                                        email: authUser.email,
                                });

                                // Link auth.uid() to user_roles row (idempotent — no-op if already linked)
                                try {
                                        await client.rpc("link_auth_uid");
                                } catch {
                                        // Non-critical: is_admin() falls back to JWT user_metadata check
                                }
                        }

                        return true;
                } catch (error) {
                        console.error("Login error:", error);
                        return false;
                }
        },

        /**
         * Register new user with Supabase Auth
         */
        async register(): Promise<void> {
                throw new Error(
                        "Registration not implemented. Please use Supabase Auth directly.",
                );
        },

        /**
         * Logout - clear Supabase session and localStorage
         */
        async logout(): Promise<void> {
                try {
                        const client = await resolveSupabaseClient();
                        if (client) {
                                await client.auth.signOut();
                        }

                        // Clear localStorage
                        if (isStorageAvailable()) {
                                clearStoredUserSnapshot();
                        }
                } catch (error) {
                        console.error("Logout error:", error);
                }
        },

        /**
         * Check if a user is admin based on Supabase roles
         */
        async checkAdminStatus(userId: string): Promise<boolean> {
                try {
                        const client = await resolveSupabaseClient();
                        if (!client) {
                                console.warn("[Auth] No Supabase client — falling back to localStorage isAdmin");
                                return Boolean(readStoredUserSnapshot()?.isAdmin);
                        }

                        // Check Supabase auth session
                        const { data: { user: sessionUser } } = await client.auth.getUser();
                        console.debug("[Auth] checkAdminStatus — session user:", sessionUser?.id ?? "none (not authenticated via Supabase Auth)");

                        const { data: isAdmin, error: rpcError } = await client.rpc("is_admin");
                        console.debug("[Auth] is_admin() RPC result:", isAdmin, "error:", rpcError?.message ?? "none");
                        if (!rpcError && typeof isAdmin === "boolean") {
                                return isAdmin;
                        }

                        console.warn("[Auth] is_admin() RPC failed, falling back to direct table query");
                        const { data, error } = await client
                                .from("cat_user_roles")
                                .select("role")
                                .eq("user_id", userId)
                                .eq("role", "admin")
                                .maybeSingle();

                        console.debug("[Auth] cat_user_roles by user_id:", data, "error:", error?.message ?? "none");
                        if (data) {
                                return true;
                        }

                        const storedUserName = readStoredUserSnapshot()?.name;
                        if (!storedUserName) {
                                console.warn("[Auth] No stored user name — cannot check by user_name");
                                return false;
                        }

                        const { data: fallbackData, error: fallbackError } = await client
                                .from("cat_user_roles")
                                .select("role")
                                .eq("user_name", storedUserName)
                                .eq("role", "admin")
                                .maybeSingle();

                        console.debug("[Auth] cat_user_roles by user_name (", storedUserName, "):", fallbackData, "error:", fallbackError?.message ?? "none");

                        if (error || fallbackError) {
                                return false;
                        }

                        return Boolean(fallbackData);
                } catch (error) {
                        console.error("[Auth] Error checking admin status:", error);
                        return false;
                }
        },
};
