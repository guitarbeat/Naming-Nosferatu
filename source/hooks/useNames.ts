/**
 * @module features/tournament/useNames
 * @description Consolidated name-related hooks: useNameData, useNameSelection, useNameSuggestion
 */

import { ErrorManager } from "@services/errorManager";
import { coreAPI, statsAPI } from "@supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useTournamentSelectionSaver } from "@/features/tournament/hooks/useTournamentSelectionSaver";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { useToast } from "@/providers/ToastProvider";
import useAppStore from "@/store";
import type { NameItem } from "@/types";
import { VALIDATION } from "@/utils/constants";

/* ==========================================================================
   USE NAME DATA HOOK
   ========================================================================== */

const FALLBACK_NAMES = [
	{ id: "fallback-1", name: "Whiskers" },
	{ id: "fallback-2", name: "Mittens" },
	{ id: "fallback-3", name: "Shadow" },
	{ id: "fallback-4", name: "Luna" },
	{ id: "fallback-5", name: "Oliver" },
];

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
					namesData = (await coreAPI.getTrendingNames(true)) as NameItem[];
				} else {
					if (!userName) {
						return [];
					}
					const rawData = await statsAPI.getUserRatedNames(userName);
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
				if (mode === "tournament") {
					return FALLBACK_NAMES as NameItem[];
				}
				throw err;
			}
		},
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 30,
	});

	const hiddenIds = useMemo(() => {
		return new Set(
			names.filter((name: NameItem) => name.is_hidden === true).map((name: NameItem) => name.id),
		);
	}, [names]);

	const updateNames = useCallback(
		(updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
			queryClient.setQueryData(["names", mode, userName], (old: NameItem[] = []) => {
				return typeof updater === "function" ? updater(old) : updater;
			});
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

/* ==========================================================================
   USE NAME SELECTION HOOK
   ========================================================================== */

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
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const lastLogTsRef = useRef(0);

	const selectedNames = useMemo(() => {
		return names.filter((n) => selectedIds.has(String(n.id)));
	}, [names, selectedIds]);

	const selectedCount = selectedIds.size;

	const { scheduleSave } = useTournamentSelectionSaver({
		userName: mode === "tournament" ? userName : null,
		enableAutoSave,
	});

	const updateSelection = useCallback(
		(updater: (prev: Set<string>) => Set<string>) => {
			setSelectedIds((prev) => {
				const newSet = updater(prev);

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
		selectedNames,
		selectedIds,
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

/* ==========================================================================
   USE NAME SUGGESTION HOOK
   ========================================================================== */

const SuggestionSchema = z.object({
	name: z
		.string()
		.min(VALIDATION.MIN_CAT_NAME_LENGTH || 2, "Name must be at least 2 characters")
		.max(VALIDATION.MAX_CAT_NAME_LENGTH || 50, "Name must be 50 characters or less"),
	description: z
		.string()
		.min(5, "Description can be short!")
		.max(VALIDATION.MAX_DESCRIPTION_LENGTH || 500, "Description must be 500 characters or less"),
});

type SuggestionFormValues = z.infer<typeof SuggestionSchema>;

interface UseNameSuggestionProps {
	onSuccess?: () => void;
	initialValues?: Partial<SuggestionFormValues>;
}

export function useNameSuggestion({ onSuccess, initialValues }: UseNameSuggestionProps = {}) {
	const [globalError, setGlobalError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const isMountedRef = useRef(true);
	const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const { showSuccess, showError } = useToast();
	const { user } = useAppStore();

	const form = useValidatedForm<typeof SuggestionSchema.shape>({
		schema: SuggestionSchema,
		initialValues: {
			name: initialValues?.name || "",
			description: initialValues?.description || "",
		},
		onSubmit: async (values) => {
			if (!user.name || !user.name.trim()) {
				setGlobalError("Please log in to suggest a name.");
				return;
			}

			try {
				setGlobalError("");
				const result = await coreAPI.addName(values.name, values.description, user.name);

				if (!isMountedRef.current) {
					return;
				}

				if (result?.success === false) {
					throw new Error(result.error || "Unable to add name. Please try again.");
				}

				setSuccessMessage("Thank you for your suggestion!");
				showSuccess("Name suggestion submitted!");
				form.reset();
				onSuccess?.();

				if (successTimeoutRef.current) {
					clearTimeout(successTimeoutRef.current);
				}
				successTimeoutRef.current = setTimeout(() => {
					if (isMountedRef.current) {
						setSuccessMessage("");
					}
					successTimeoutRef.current = null;
				}, 3000);
			} catch (err) {
				if (!isMountedRef.current) {
					return;
				}

				const errorMessage =
					err instanceof Error
						? err.message
						: "Unable to submit your suggestion. Please try again.";
				setGlobalError(errorMessage);
				showError(errorMessage);

				ErrorManager.handleError(err, "Add Name Suggestion", {
					isRetryable: true,
					affectsUserData: false,
					isCritical: false,
				});
			}
		},
	});

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
			if (successTimeoutRef.current) {
				clearTimeout(successTimeoutRef.current);
			}
		};
	}, []);

	const handleReset = useCallback(() => {
		form.reset();
		setGlobalError("");
		setSuccessMessage("");
	}, [form]);

	return {
		...form,
		globalError,
		successMessage,
		handleReset,
		setGlobalError,
	};
}
