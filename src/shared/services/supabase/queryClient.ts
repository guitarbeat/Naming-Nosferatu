/**
 * @module queryClient
 * @description React Query client configuration for Supabase data fetching.
 * Provides modern caching, refetching, and error handling patterns.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * * React Query client with optimized defaults for Supabase
 * - Stale time: 30 seconds (data is fresh for 30s)
 * - Cache time: 5 minutes (data stays in cache for 5min after last use)
 * - Retry: 3 attempts with exponential backoff
 * - Refetch on window focus: disabled (prevents unnecessary refetches)
 * - Refetch on reconnect: enabled (refetch when network reconnects)
 * - Refetch on mount: enabled to ensure fresh data when components mount
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

