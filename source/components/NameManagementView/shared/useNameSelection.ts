import { useCallback, useMemo, useRef, useState } from "react";
import { useTournamentSelectionSaver } from "@/features/tournament/useTournamentSelectionSaver";
import type { NameItem } from "@/types/components";

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

	const lastLogTsRef = useRef(0);

	// Derive the selectedNames array for components that expect it
	const selectedNames = useMemo(() => {
		return names.filter((n) => selectedIds.has(String(n.id)));
	}, [names, selectedIds]);

	const selectedCount = selectedIds.size;

	// Use the dedicated tournament selection saver
	const { scheduleSave } = useTournamentSelectionSaver({
		userName: mode === "tournament" ? userName : null,
		enableAutoSave,
	});

	// Unified updater helper to handle side-effects consistently
	const updateSelection = useCallback(
		(updater: (prev: Set<string>) => Set<string>) => {
			setSelectedIds((prev) => {
				const newSet = updater(prev);

				// For tournament mode, schedule the save side-effect
				if (mode === "tournament") {
					const updatedList = names.filter((n) => newSet.has(String(n.id)));

					if (Date.now() - lastLogTsRef.current > 1000 && process.env.NODE_ENV === "development") {
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

	const toggleName = useCallback(
		(nameOrId: NameItem | string) => {
			const id = typeof nameOrId === "string" ? nameOrId : String(nameOrId.id);
			updateSelection((prev) => {
				const newSet = new Set(prev);
				if (newSet.has(id)) {
					newSet.delete(id);
				} else {
					newSet.add(id);
				}
				return newSet;
			});
		},
		[updateSelection],
	);

	const toggleNameById = useCallback(
		(nameId: string, selected: boolean) => {
			const id = String(nameId);
			updateSelection((prev) => {
				const newSet = new Set(prev);
				if (selected) {
					newSet.add(id);
				} else {
					newSet.delete(id);
				}
				return newSet;
			});
		},
		[updateSelection],
	);

	const toggleNamesByIds = useCallback(
		(nameIds: string[] = [], shouldSelect = true) => {
			if (!Array.isArray(nameIds) || nameIds.length === 0) {
				return;
			}
			updateSelection((prev) => {
				const newSet = new Set(prev);
				nameIds.forEach((id) => {
					if (shouldSelect) {
						newSet.add(String(id));
					} else {
						newSet.delete(String(id));
					}
				});
				return newSet;
			});
		},
		[updateSelection],
	);

	const selectAll = useCallback(() => {
		updateSelection((prev) => {
			const allSelected = prev.size === names.length;
			return allSelected ? new Set() : new Set(names.map((n) => String(n.id)));
		});
	}, [names, updateSelection]);

	const clearSelection = useCallback(() => {
		updateSelection(() => new Set());
	}, [updateSelection]);

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
