/**
 * @module useNameManagement
 * @description Consolidated hooks for name data fetching and selection management
 * Combines useNameData and useNameSelection for unified name management
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FALLBACK_NAMES } from "../../../features/tournament/config";
import { ErrorManager } from "../../services/errorManager/index";
import {
	getNamesWithDescriptions,
	getNamesWithUserRatings,
	tournamentsAPI,
} from "../../services/supabase/supabaseClient";
import { devLog } from "../../utils/coreUtils";

// ============================================================================
// Types
// ============================================================================

interface Name {
	id: string;
	name: string;
	description?: string;
	is_hidden?: boolean;
	[key: string]: unknown;
}

// ============================================================================
// Name Data Hook
// ============================================================================

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
				let namesData: Name[];

				if (mode === "tournament") {
					namesData = (await getNamesWithDescriptions(true)) as Name[];
				} else {
					if (!userName) return [];
					const rawData = await getNamesWithUserRatings(userName);
					namesData = (
						rawData as Array<{
							id: string;
							name: string;
							[key: string]: unknown;
						}>
					).map((name) => ({
						...name,
						owner: userName,
					})) as Name[];
				}

				if (!Array.isArray(namesData)) {
					throw new Error("Invalid response: namesData is not an array");
				}

				return [...namesData].sort((a: Name, b: Name) =>
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
				if (mode === "tournament") return FALLBACK_NAMES as Name[];
				throw err;
			}
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
		gcTime: 1000 * 60 * 30, // 30 minutes
	});

	const hiddenIds = useMemo(() => {
		return new Set(
			names
				.filter((name: Name) => name.is_hidden === true)
				.map((name: Name) => name.id),
		);
	}, [names]);

	const updateNames = useCallback(
		(updater: Name[] | ((prev: Name[]) => Name[])) => {
			queryClient.setQueryData(
				["names", mode, userName],
				(old: Name[] = []) => {
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
		// setHiddenIds is removed as it's now derived from names
	};
}

// ============================================================================
// Name Selection Hook
// ============================================================================

interface UseNameSelectionProps {
	names?: Name[];
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
	const [selectedNames, setSelectedNames] = useState<Name[] | Set<string>>(
		mode === "tournament" ? [] : new Set<string>(),
	);

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

	const { mutate: saveTournamentSelections } = useMutation({
		mutationFn: async (namesToSave: Name[]) => {
			if (mode !== "tournament" || !userName) return;
			const tournamentId = `selection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const result = await tournamentsAPI.saveTournamentSelections(
				userName,
				namesToSave,
				tournamentId,
			);
			if (process.env.NODE_ENV === "development") {
				devLog("🎮 TournamentSetup: Selections saved to database", result);
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
		(namesToSave: Name[]) => {
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
		(nameOrId: Name | string) => {
			if (mode === "tournament") {
				setSelectedNames((prev) => {
					const prevArray = prev as Name[];
					const nameObj = nameOrId as Name;
					const newSelectedNames = prevArray.some(
						(n: Name) => n.id === nameObj.id,
					)
						? prevArray.filter((n: Name) => n.id !== nameObj.id)
						: [...prevArray, nameObj];

					if (
						Date.now() - lastLogTsRef.current > 1000 &&
						process.env.NODE_ENV === "development"
					) {
						devLog(
							"🎮 TournamentSetup: Selected names updated",
							newSelectedNames,
						);
						lastLogTsRef.current = Date.now();
					}

					scheduleSave(newSelectedNames);
					return newSelectedNames;
				});
			} else {
				setSelectedNames((prev) => {
					const newSet = new Set(prev as Set<string>);
					const id = typeof nameOrId === "string" ? nameOrId : nameOrId.id;
					if (newSet.has(id)) {
						newSet.delete(id);
					} else {
						newSet.add(id);
					}
					return newSet;
				});
			}
		},
		[mode, scheduleSave],
	);

	const toggleNameById = useCallback(
		(nameId: string, selected: boolean) => {
			if (mode === "tournament") {
				const nameObj = (names as Name[]).find((n) => n.id === nameId);
				if (nameObj) {
					if (selected) {
						setSelectedNames((prev) => {
							const prevArray = prev as Name[];
							if (prevArray.some((n: Name) => n.id === nameId)) return prev;
							const newSelectedNames = [...prevArray, nameObj];
							scheduleSave(newSelectedNames);
							return newSelectedNames;
						});
					} else {
						setSelectedNames((prev) => {
							const prevArray = prev as Name[];
							const newSelectedNames = prevArray.filter(
								(n: Name) => n.id !== nameId,
							);
							scheduleSave(newSelectedNames);
							return newSelectedNames;
						});
					}
				}
			} else {
				setSelectedNames((prev) => {
					const newSet = new Set(prev as Set<string>);
					if (selected) {
						newSet.add(nameId);
					} else {
						newSet.delete(nameId);
					}
					return newSet;
				});
			}
		},
		[mode, names, scheduleSave],
	);

	const toggleNamesByIds = useCallback(
		(nameIds: string[] = [], shouldSelect = true) => {
			if (!Array.isArray(nameIds) || nameIds.length === 0) {
				return;
			}
			const idSet = new Set(nameIds);
			if (mode === "tournament") {
				setSelectedNames((prev) => {
					const prevArray = prev as Name[];
					if (shouldSelect) {
						const additions = (names as Name[]).filter(
							(name: Name) =>
								idSet.has(name.id) &&
								!prevArray.some((selected: Name) => selected.id === name.id),
						);
						if (additions.length === 0) return prev;
						const updated = [...prevArray, ...additions];
						scheduleSave(updated);
						return updated;
					}
					const updated = prevArray.filter((name: Name) => !idSet.has(name.id));
					if (updated.length === prevArray.length) return prev;
					scheduleSave(updated);
					return updated;
				});
			} else {
				setSelectedNames((prev) => {
					const updated = new Set(prev as Set<string>);
					if (shouldSelect) {
						idSet.forEach((id) => {
							updated.add(id);
						});
					} else {
						idSet.forEach((id) => {
							updated.delete(id);
						});
					}
					return updated;
				});
			}
		},
		[mode, names, scheduleSave],
	);

	const selectAll = useCallback(() => {
		if (mode === "tournament") {
			setSelectedNames((prev) => {
				const prevArray = prev as Name[];
				const allSelected = prevArray.length === names.length;
				return allSelected ? [] : [...names];
			});
		} else {
			setSelectedNames((prev) => {
				const prevSet = prev as Set<string>;
				const allSelected = names.every((name: Name) => prevSet.has(name.id));
				if (allSelected) {
					return new Set<string>();
				}
				return new Set<string>(names.map((name: Name) => name.id));
			});
		}
	}, [mode, names]);

	const clearSelection = useCallback(() => {
		if (mode === "tournament") {
			setSelectedNames([]);
		} else {
			setSelectedNames(new Set<string>());
		}
	}, [mode]);

	const isSelected = useCallback(
		(nameOrId: Name | string) => {
			if (mode === "tournament") {
				const nameObj = nameOrId as Name;
				return (selectedNames as Name[]).some((n: Name) => n.id === nameObj.id);
			}
			const id = typeof nameOrId === "string" ? nameOrId : nameOrId.id;
			return (selectedNames as Set<string>).has(id);
		},
		[mode, selectedNames],
	);

	const selectedCount =
		mode === "tournament"
			? (selectedNames as Name[]).length
			: (selectedNames as Set<string>).size;

	return {
		selectedNames,
		setSelectedNames,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll,
		clearSelection,
		isSelected,
		selectedCount,
	};
}
