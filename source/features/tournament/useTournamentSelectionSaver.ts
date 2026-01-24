import { useCallback, useRef } from "react";
import type { NameItem } from "@/types/components";

interface UseTournamentSelectionSaverProps {
	userName: string | null;
	enableAutoSave?: boolean;
}

/**
 * Hook for auto-saving tournament selections
 * Debounces save operations to avoid excessive API calls
 */
export function useTournamentSelectionSaver({
	userName,
	enableAutoSave = true,
}: UseTournamentSelectionSaverProps) {
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedRef = useRef<string>("");

	const scheduleSave = useCallback(
		(selectedNames: NameItem[]) => {
			if (!userName || !enableAutoSave) {
				return;
			}

			// Clear any pending save
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// Create a hash of the current selection to detect changes
			const selectionHash = selectedNames
				.map((n) => n.id)
				.sort()
				.join(",");
			if (selectionHash === lastSavedRef.current) {
				return;
			}

			// Debounce the save operation
			saveTimeoutRef.current = setTimeout(async () => {
				try {
					// Save to localStorage as a simple persistence mechanism
					localStorage.setItem(
						`tournament_selection_${userName}`,
						JSON.stringify(selectedNames.map((n) => n.id)),
					);
					lastSavedRef.current = selectionHash;
				} catch (error) {
					console.error("Failed to save tournament selection:", error);
				}
			}, 1000);
		},
		[userName, enableAutoSave],
	);

	const loadSavedSelection = useCallback(() => {
		if (!userName) {
			return [];
		}
		try {
			const saved = localStorage.getItem(`tournament_selection_${userName}`);
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	}, [userName]);

	return {
		scheduleSave,
		loadSavedSelection,
	};
}
