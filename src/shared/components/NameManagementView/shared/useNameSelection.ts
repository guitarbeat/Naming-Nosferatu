import { useCallback, useMemo, useRef, useState } from "react";
import type { NameItem } from "@/types/components";
import { useTournamentSelectionSaver } from "../../../../features/tournament/hooks/useTournamentSelectionSaver";

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
			if (!Array.isArray(nameIds) || nameIds.length === 0) {
				return;
			}

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
				if (mode === "tournament") {
					scheduleSave([]);
				}
				return new Set();
			}

			const newSet = new Set(names.map((n) => String(n.id)));
			if (mode === "tournament") {
				scheduleSave(names);
			}
			return newSet;
		});
	}, [mode, names, scheduleSave]);

	const clearSelection = useCallback(() => {
		setSelectedIds(new Set());
		if (mode === "tournament") {
			scheduleSave([]);
		}
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
