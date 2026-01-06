import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorManager } from "../../../services/errorManager/index";
import { tournamentsAPI } from "../../../services/supabase/client";
import type { NameItem } from "./types";

interface UseNameSelectionProps {
    names?: NameItem[];
    mode?: "tournament" | "profile";
    userName: string | null;
    enableAutoSave?: boolean;
}

export function useNameSelection({
    names = [],
    mode = "tournament",
    userName,
    enableAutoSave = true,
}: UseNameSelectionProps) {
    // Unify state to always use a Set of IDs (strings)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedHashRef = useRef("");
    const lastLogTsRef = useRef(0);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Derive the selectedNames array for components that expect it
    const selectedNames = useMemo(() => {
        return names.filter((n) => selectedIds.has(String(n.id)));
    }, [names, selectedIds]);

    const selectedCount = selectedIds.size;

    const { mutate: saveTournamentSelections } = useMutation({
        mutationFn: async (namesToSave: NameItem[]) => {
            if (mode !== "tournament" || !userName) return;
            const tournamentId = `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const result = await tournamentsAPI.saveTournamentSelections(
                userName,
                namesToSave,
                tournamentId,
            );
            if (process.env.NODE_ENV === "development") {
                console.log("🎮 TournamentSetup: Selections saved to database", result);
            }
            return result;
        },
        onError: (error) => {
            ErrorManager.handleError(error, "Save Tournament Selections", {
                isRetryable: true,
                affectsUserData: false,
                isCritical: false,
            });
        },
    });

    const scheduleSave = useCallback(
        (namesToSave: NameItem[]) => {
            if (mode !== "tournament" || !enableAutoSave || !userName) return;
            if (!Array.isArray(namesToSave) || namesToSave.length === 0) return;

            const hash = namesToSave
                .map((n) => n.id || n.name)
                .sort()
                .join(",");

            if (hash === lastSavedHashRef.current) return;

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                lastSavedHashRef.current = hash;
                saveTournamentSelections(namesToSave);
            }, 800);
        },
        [mode, userName, enableAutoSave, saveTournamentSelections],
    );

    const toggleName = useCallback(
        (nameOrId: NameItem | string) => {
            const id = typeof nameOrId === "string" ? nameOrId : String(nameOrId.id);

            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }

                // For tournament mode, we still want to schedule the save with full objects
                if (mode === "tournament") {
                    const updatedList = names.filter((n) => newSet.has(String(n.id)));

                    if (
                        Date.now() - lastLogTsRef.current > 1000 &&
                        process.env.NODE_ENV === "development"
                    ) {
                        console.log("🎮 TournamentSetup: Selection updated", updatedList);
                        lastLogTsRef.current = Date.now();
                    }
                    scheduleSave(updatedList);
                }

                return newSet;
            });
        },
        [mode, names, scheduleSave],
    );

    const toggleNameById = useCallback(
        (nameId: string, selected: boolean) => {
            const id = String(nameId);
            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                if (selected) {
                    newSet.add(id);
                } else {
                    newSet.delete(id);
                }

                if (mode === "tournament") {
                    const updatedList = names.filter((n) => newSet.has(String(n.id)));
                    scheduleSave(updatedList);
                }

                return newSet;
            });
        },
        [mode, names, scheduleSave],
    );

    const toggleNamesByIds = useCallback(
        (nameIds: string[] = [], shouldSelect = true) => {
            if (!Array.isArray(nameIds) || nameIds.length === 0) return;

            setSelectedIds((prev) => {
                const newSet = new Set(prev);
                nameIds.forEach((id) => {
                    if (shouldSelect) {
                        newSet.add(String(id));
                    } else {
                        newSet.delete(String(id));
                    }
                });

                if (mode === "tournament") {
                    const updatedList = names.filter((n) => newSet.has(String(n.id)));
                    scheduleSave(updatedList);
                }

                return newSet;
            });
        },
        [mode, names, scheduleSave],
    );

    const selectAll = useCallback(() => {
        setSelectedIds((prev) => {
            const allSelected = prev.size === names.length;
            if (allSelected) {
                if (mode === "tournament") scheduleSave([]);
                return new Set();
            }

            const newSet = new Set(names.map((n) => String(n.id)));
            if (mode === "tournament") scheduleSave(names);
            return newSet;
        });
    }, [mode, names, scheduleSave]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
        if (mode === "tournament") scheduleSave([]);
    }, [mode, scheduleSave]);

    const isSelected = useCallback(
        (nameOrId: NameItem | string) => {
            const id = typeof nameOrId === "string" ? nameOrId : String(nameOrId.id);
            return selectedIds.has(id);
        },
        [selectedIds],
    );

    return {
        selectedNames, // Array of NameItem for backward sync
        selectedIds, // Set of strings for efficient lookups
        setSelectedIds,
        toggleName,
        toggleNameById,
        toggleNamesByIds,
        selectAll,
        clearSelection,
        isSelected,
        selectedCount,
    };
}
