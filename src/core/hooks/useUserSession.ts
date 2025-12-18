/**
 * @module useUserSession
 * @description Hook for managing user sessions with username-based authentication (no email/password)
 * @example
 * const { login, logout, error, userName, isLoggedIn } = useUserSession({ showToast });
 * await login('MyUsername');
 * await logout();
 */

import { useState, useCallback, useEffect } from "react";
import { resolveSupabaseClient } from "../../shared/services/supabase/client";
import useAppStore from "../store/useAppStore";
import { isUserAdmin } from "../../shared/utils/authUtils";

let canUseSetUserContext = true;

const isRpcUnavailableError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;

  const statusCode = typeof err.status === "number" ? err.status : null;
  const errorCode = typeof err.code === "string" ? err.code.toUpperCase() : "";
  const message = (err.message as string)?.toLowerCase?.() ?? "";

  return (
    statusCode === 404 ||
    errorCode === "404" ||
    errorCode === "PGRST301" ||
    errorCode === "PGRST303" ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
};

const setSupabaseUserContext = async (
  activeSupabase: unknown,
  userName: string,
) => {
  if (!canUseSetUserContext || !activeSupabase || !userName) {
    return;
  }

  try {
    const trimmedName = userName.trim?.() ?? userName;
    if (!trimmedName) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (activeSupabase as any).rpc("set_user_context", {
      user_name_param: trimmedName,
    });
  } catch (error) {
    if (isRpcUnavailableError(error)) {
      canUseSetUserContext = false;
      if (process.env.NODE_ENV === "development") {
        console.info(
          "Supabase set_user_context RPC is unavailable. Skipping future context calls.",
        );
      }
    } else if (process.env.NODE_ENV === "development") {
      console.warn("Failed to set Supabase user context:", error);
    }
  }
};

function useUserSession({
  showToast,
}: { showToast?: (props: { message: string; type: string }) => void } = {}) {
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user, userActions } = useAppStore();

  // Initialize user from localStorage on mount
  useEffect(() => {
    let storedUserName = null;
    try {
      storedUserName = localStorage.getItem("catNamesUser");
    } catch (error) {
      // localStorage might not be available (private browsing, etc.)
      if (process.env.NODE_ENV === "development") {
        console.warn("Unable to access localStorage:", error);
      }
    }

    if (storedUserName && storedUserName.trim()) {
      userActions.login(storedUserName);

      // Set username context for RLS policies (username-based auth)
      (async () => {
        try {
          const activeSupabase = await resolveSupabaseClient();
          await setSupabaseUserContext(activeSupabase, storedUserName);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Failed to initialize Supabase user context:", error);
          }
        }
      })();

      // Check admin status server-side
      isUserAdmin(storedUserName)
        .then((adminStatus: boolean) => {
          userActions.setAdminStatus(adminStatus);
        })
        .catch(() => {
          userActions.setAdminStatus(false);
        });
    }
    setIsInitialized(true);
  }, [userActions]);

  /**
   * Normalize username to prevent duplicate accounts with different casing
   * Capitalizes first letter, lowercases the rest
   * @param {string} name - Raw username input
   * @returns {string} Normalized username
   */
  const normalizeUsername = (name: string) => {
    if (!name || typeof name !== "string") return "";
    const trimmed = name.trim();
    if (!trimmed) return "";
    // Capitalize first letter, lowercase the rest
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  /**
   * Login with username only (no password required)
   * Creates user in database if doesn't exist
   * @param {string} userName - The user's chosen username
   */
  const login = useCallback(
    async (userName: string) => {
      if (!userName || !userName.trim()) {
        setError("Username is required");
        return false;
      }

      try {
        setError(null);
        const trimmedName = normalizeUsername(userName);

        const activeSupabase = await resolveSupabaseClient();

        if (!activeSupabase) {
          console.warn(
            "Supabase client is not configured. Proceeding with local-only login.",
          );

          localStorage.setItem("catNamesUser", trimmedName);
          userActions.login(trimmedName);
          return true;
        }

        // Ensure the RLS session uses the current username
        await setSupabaseUserContext(activeSupabase, trimmedName);

        // Check if user exists in database
        const { data: existingUser, error: fetchError } = await activeSupabase
          .from("cat_app_users")
          .select("user_name, preferences")
          .eq("user_name", trimmedName)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching user:", fetchError);
          const errorMessage =
            fetchError.message || "Cannot verify existing user";
          showToast?.({ message: errorMessage, type: "error" });
          throw fetchError;
        }

        // Create user if doesn't exist using RPC function (bypasses RLS)
        if (!existingUser) {
          // * Use the create_user_account RPC function which bypasses RLS
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: rpcError } = await (activeSupabase as any).rpc(
            "create_user_account",
            {
              p_user_name: trimmedName,
              p_preferences: {
                sound_enabled: true,
                theme_preference: "dark",
              },
            },
          );

          if (rpcError) {
            // * Check if this is a duplicate key error (race condition)
            // * PostgreSQL error code 23505 = unique_violation
            // * Supabase may also return code "PGRST116" for unique constraint violations
            const isDuplicateKeyError =
              rpcError.code === "23505" ||
              rpcError.code === "PGRST116" ||
              rpcError.message?.includes("duplicate key") ||
              rpcError.message?.includes("unique constraint") ||
              rpcError.message?.includes("already exists");

            if (isDuplicateKeyError) {
              // * This is likely a race condition - verify if user was actually created
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  "RPC create_user_account duplicate key error (race condition):",
                  rpcError,
                );
              }

              const { data: verifyUser } = await activeSupabase
                .from("cat_app_users")
                .select("user_name")
                .eq("user_name", trimmedName)
                .maybeSingle();

              if (verifyUser) {
                // * User was created (race condition), continue
                showToast?.({ message: "Logging in...", type: "info" });
              } else {
                // * Unexpected: duplicate key error but user doesn't exist
                const errorMessage =
                  rpcError.message || "Failed to create user account";
                if (process.env.NODE_ENV === "development") {
                  console.error(
                    "Duplicate key error but user not found:",
                    errorMessage,
                  );
                }
                showToast?.({ message: errorMessage, type: "error" });
                throw rpcError;
              }
            } else {
              // * Not a duplicate key error - this is a real error
              const errorMessage =
                rpcError.message || "Failed to create user account";
              if (process.env.NODE_ENV === "development") {
                console.error("Error creating user:", errorMessage, rpcError);
              }
              showToast?.({ message: errorMessage, type: "error" });
              throw rpcError;
            }
          } else {
            showToast?.({
              message: "Account created successfully!",
              type: "success",
            });
          }
        } else {
          showToast?.({ message: "Logging in...", type: "info" });
        }

        // Store username and update state
        localStorage.setItem("catNamesUser", trimmedName);
        userActions.login(trimmedName);

        // Check admin status server-side
        const adminStatus = await isUserAdmin(trimmedName);
        userActions.setAdminStatus(adminStatus);

        return true;
      } catch (err: unknown) {
        const error = err as Error;
        let errorMessage = "Failed to login";

        // Handle specific error types
        if (error.message?.includes("fetch")) {
          errorMessage =
            "Cannot connect to database. Please check your connection.";
        } else if (error.message?.includes("JWT")) {
          errorMessage = "Authentication error. Please try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error("Login error:", errorMessage);
        setError(errorMessage);
        showToast?.({ message: errorMessage, type: "error" });
        return false;
      }
    },
    [userActions, showToast],
  );

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      localStorage.removeItem("catNamesUser");
      userActions.logout();
      return true;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Logout error:", error);
      setError(error.message || "Failed to logout");
      return false;
    }
  }, [userActions]);

  return {
    userName: user.name,
    isLoggedIn: user.isLoggedIn,
    error,
    login,
    logout,
    isInitialized,
  };
}

export default useUserSession;
