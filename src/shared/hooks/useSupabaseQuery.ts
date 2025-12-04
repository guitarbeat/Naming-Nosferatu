/**
 * @module useSupabaseQuery
 * @description Modern React Query hook wrapper for Supabase queries.
 * Provides type-safe, cached data fetching with automatic error handling.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { resolveSupabaseClient } from "@services/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@services/supabase/types";

/**
 * * Modern hook for Supabase queries with React Query
 * @template TData - Type of data returned from the query
 * @param {Object} options - Query options
 * @param {string} options.queryKey - Unique key for caching (e.g., ['names', userId])
 * @param {Function} options.queryFn - Async function that uses Supabase client
 * @param {boolean} options.enabled - Whether query should run (default: true)
 * @param {number} options.staleTime - How long data is considered fresh (ms)
 * @param {UseQueryOptions} options.otherOptions - Additional React Query options
 * @returns {UseQueryResult} Query result with data, isLoading, error, etc.
 */
export function useSupabaseQuery<TData = unknown>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime,
  ...otherOptions
}: {
  queryKey: readonly unknown[];
  queryFn: (client: SupabaseClient<Database>) => Promise<TData>;
  enabled?: boolean;
  staleTime?: number;
} & Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">): UseQueryResult<TData> {
  return useQuery<TData>({
    queryKey,
    queryFn: async () => {
      const client = await resolveSupabaseClient();
      if (!client) {
        throw new Error("Supabase client not available");
      }
      return queryFn(client);
    },
    enabled,
    staleTime,
    ...otherOptions,
  });
}

