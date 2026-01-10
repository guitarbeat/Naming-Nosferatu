import { useMutation } from "@tanstack/react-query";
import React, { useCallback, useRef } from "react";
import type { NameItem } from "@/types/components";
import { ErrorManager } from "../../../shared/services/errorManager/index";
import { tournamentsAPI } from "../services/tournamentService";

interface UseTournamentSelectionSaverProps {
	userName: string | null;
	enableAutoSave?: boolean;
}

/**
 * Hook for auto-saving tournament selections with debouncing
 */
export function useTournamentSelectionSaver({
	userName,
	enableAutoSave = true,
}: UseTournamentSelectionSaverProps) {
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedHashRef = useRef("");

	const { mutate: saveTournamentSelections } = useMutation({
		mutationFn: async (namesToSave: NameItem[]) => {
			if (!userName) {
				return;
			}
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
			if (!enableAutoSave || !userName) {
				return;
			}
			if (!Array.isArray(namesToSave) || namesToSave.length === 0) {
				return;
			}

			const hash = namesToSave
				.map((n) => n.id || n.name)
				.sort()
				.join(",");

			if (hash === lastSavedHashRef.current) {
				return;
			}

			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
			saveTimeoutRef.current = setTimeout(() => {
				lastSavedHashRef.current = hash;
				saveTournamentSelections(namesToSave);
			}, 800);
		},
		[userName, enableAutoSave, saveTournamentSelections],
	);

	const saveImmediately = useCallback(
		(namesToSave: NameItem[]) => {
			if (!userName) {
				return;
			}
			if (!Array.isArray(namesToSave) || namesToSave.length === 0) {
				return;
			}

			// Clear any pending debounced save
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			const hash = namesToSave
				.map((n) => n.id || n.name)
				.sort()
				.join(",");
			lastSavedHashRef.current = hash;

			saveTournamentSelections(namesToSave);
		},
		[userName, saveTournamentSelections],
	);

	return {
		scheduleSave,
		saveImmediately,
	};
}
