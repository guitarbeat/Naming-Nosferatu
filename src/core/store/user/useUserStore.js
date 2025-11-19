/**
 * @module useUserStore
 * @description User authentication and profile state management
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

const getInitialUserState = () => {
  const defaultState = {
    name: "",
    isLoggedIn: false,
    isAdmin: false,
    preferences: {},
  };

  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const storedUser = window.localStorage.getItem("catNamesUser");
    if (storedUser && storedUser.trim()) {
      return {
        ...defaultState,
        name: storedUser.trim(),
        isLoggedIn: true,
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Unable to read stored user from localStorage:", error);
    }
  }

  return defaultState;
};

export const useUserStore = create(
  devtools(
    (set) => ({
      // * User State
      user: getInitialUserState(),

      // * User Actions
      userActions: {
        setUser: (userData) =>
          set((state) => {
            const newUser = {
              ...state.user,
              ...userData,
            };
            // * Persist to localStorage
            try {
              if (newUser.name) {
                localStorage.setItem("catNamesUser", newUser.name);
              } else {
                localStorage.removeItem("catNamesUser");
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("Error updating localStorage:", error);
              }
            }
            return {
              user: newUser,
            };
          }),

        login: (userName) =>
          set((state) => {
            const newUser = {
              ...state.user,
              name: userName,
              isLoggedIn: true,
            };
            // * Persist to localStorage
            try {
              localStorage.setItem("catNamesUser", userName);
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("Error updating localStorage:", error);
              }
            }
            return {
              user: newUser,
            };
          }),

        logout: () =>
          set((state) => {
            // * Clear localStorage
            try {
              localStorage.removeItem("catNamesUser");
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("Error clearing localStorage:", error);
              }
            }
            return {
              user: {
                ...state.user,
                name: "",
                isLoggedIn: false,
                isAdmin: false,
              },
            };
          }),

        setAdminStatus: (isAdmin) =>
          set((state) => ({
            user: {
              ...state.user,
              isAdmin,
            },
          })),

        // * Initialize user from localStorage
        initializeFromStorage: () =>
          set((state) => {
            try {
              const storedUser = localStorage.getItem("catNamesUser");
              if (storedUser && state.user.name !== storedUser) {
                return {
                  user: {
                    ...state.user,
                    name: storedUser,
                    isLoggedIn: true,
                  },
                };
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("Error reading from localStorage:", error);
              }
            }
            return state;
          }),
      },
    }),
    {
      name: "user-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

export default useUserStore;

