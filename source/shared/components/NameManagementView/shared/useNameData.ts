import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { NameItem } from "@/types/components";
// FALLBACK_NAMES - inline fallback since tournamentUtils was consolidated
const FALLBACK_NAMES = [
  { id: "fallback-1", name: "Whiskers" },
  { id: "fallback-2", name: "Mittens" },
  { id: "fallback-3", name: "Shadow" },
  { id: "fallback-4", name: "Luna" },
  { id: "fallback-5", name: "Oliver" },
];
import { ErrorManager } from "../../../services/errorManager/index";
import { catNamesAPI } from "../../../services/supabase/client";

interface UseNameDataProps {
  userName: string | null;
  mode?: "tournament" | "profile";
  enableErrorHandling?: boolean;
}

export function useNameData({
  userName,
  mode = "tournament",
  enableErrorHandling = true,
}: UseNameDataProps) {
  const queryClient = useQueryClient();

  const {
    data: names = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["names", mode, userName],
    queryFn: async () => {
      try {
        let namesData: NameItem[];

        if (mode === "tournament") {
          namesData = (await catNamesAPI.getNamesWithDescriptions(
            true,
          )) as NameItem[];
        } else {
          if (!userName) {
            return [];
          }
          const rawData = await catNamesAPI.getNamesWithUserRatings(userName);
          namesData = (
            rawData as Array<{
              id: string;
              name: string;
              [key: string]: unknown;
            }>
          ).map((name) => ({
            ...name,
            owner: userName,
          })) as NameItem[];
        }

        if (!Array.isArray(namesData)) {
          throw new Error("Invalid response: namesData is not an array");
        }

        return [...namesData].sort((a: NameItem, b: NameItem) =>
          (a?.name || "").localeCompare(b?.name || ""),
        );
      } catch (err) {
        if (enableErrorHandling) {
          ErrorManager.handleError(
            err,
            `${mode === "tournament" ? "TournamentSetup" : "Profile"} - Fetch Names`,
            {
              isRetryable: true,
              affectsUserData: false,
              isCritical: false,
            },
          );
        }
        // Return fallback names for tournament mode on error
        if (mode === "tournament") {
          return FALLBACK_NAMES as NameItem[];
        }
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  const hiddenIds = useMemo(() => {
    return new Set(
      names
        .filter((name: NameItem) => name.is_hidden === true)
        .map((name: NameItem) => name.id),
    );
  }, [names]);

  const updateNames = useCallback(
    (updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
      queryClient.setQueryData(
        ["names", mode, userName],
        (old: NameItem[] = []) => {
          return typeof updater === "function" ? updater(old) : updater;
        },
      );
    },
    [queryClient, mode, userName],
  );

  return {
    names,
    hiddenIds,
    isLoading,
    error,
    refetch,
    setNames: updateNames,
  };
}
