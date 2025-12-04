/**
 * @module useNamesQuery
 * @description Modern React Query hook for fetching cat names.
 * Example of how to migrate from manual useState/useEffect to React Query.
 */

import { useSupabaseQuery } from "./useSupabaseQuery";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@services/supabase/types";

export interface CatName {
  id: number;
  name: string;
  description: string | null;
  avg_rating: number;
  categories: string[] | null;
  is_hidden: boolean;
  is_active: boolean;
}

/**
 * * Modern hook for fetching cat names with React Query
 * @param {Object} options - Query options
 * @param {boolean} options.includeHidden - Whether to include hidden names (default: false)
 * @param {boolean} options.enabled - Whether query should run (default: true)
 * @returns {Object} Query result with data, isLoading, error, refetch, etc.
 */
export function useNamesQuery({
  includeHidden = false,
  enabled = true,
}: {
  includeHidden?: boolean;
  enabled?: boolean;
} = {}) {
  return useSupabaseQuery<CatName[]>({
    queryKey: ["names", includeHidden ? "all" : "visible"],
    queryFn: async (client: SupabaseClient<Database>) => {
      let query = client
        .from("cat_name_options")
        .select("*")
        .eq("is_active", true)
        .order("avg_rating", { ascending: false });

      if (!includeHidden) {
        query = query.eq("is_hidden", false);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch names: ${error.message}`);
      }

      return (data || []) as CatName[];
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds - names don't change frequently
  });
}

