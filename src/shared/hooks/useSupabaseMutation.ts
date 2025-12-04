/**
 * @module useSupabaseMutation
 * @description Modern React Query hook wrapper for Supabase mutations.
 * Provides type-safe mutations with optimistic updates and error handling.
 */

import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { resolveSupabaseClient } from "@services/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@services/supabase/types";

/**
 * * Modern hook for Supabase mutations with React Query
 * @template TData - Type of data returned from the mutation
 * @template TVariables - Type of variables passed to the mutation
 * @param {Object} options - Mutation options
 * @param {Function} options.mutationFn - Async function that uses Supabase client
 * @param {string[]} options.invalidateQueries - Query keys to invalidate after mutation
 * @param {Function} options.onSuccess - Callback on successful mutation
 * @param {Function} options.onError - Callback on mutation error
 * @param {UseMutationOptions} options.otherOptions - Additional React Query options
 * @returns {UseMutationResult} Mutation result with mutate, mutateAsync, isLoading, etc.
 */
export function useSupabaseMutation<TData = unknown, TVariables = void>({
  mutationFn,
  invalidateQueries,
  onSuccess,
  onError,
  ...otherOptions
}: {
  mutationFn: (
    variables: TVariables,
    client: SupabaseClient<Database>,
  ) => Promise<TData>;
  invalidateQueries?: readonly unknown[][];
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
} & Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">): UseMutationResult<
  TData,
  Error,
  TVariables
> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const client = await resolveSupabaseClient();
      if (!client) {
        throw new Error("Supabase client not available");
      }
      return mutationFn(variables, client);
    },
    onSuccess: async (data, variables) => {
      // * Invalidate related queries to refetch fresh data
      if (invalidateQueries) {
        await Promise.all(
          invalidateQueries.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );
      }
      await onSuccess?.(data, variables);
    },
    onError: async (error, variables) => {
      await onError?.(error, variables);
    },
    ...otherOptions,
  });
}

