import { useCallback, useEffect, useMemo, useState } from "react";
import { coreAPI } from "@/services/supabase/client";
import { useLocalStorage } from "@/shared/hooks";
import type { NameItem } from "@/shared/types";

/* =========================================================================
   Cache Logic
   ========================================================================= */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = "names_cache_v3";

interface CacheEntry {
	data: NameItem[];
	timestamp: number;
}

// Module-level cache to share data between hook instances
const nameCache = new Map<string, CacheEntry>();

let isCacheLoaded = false;

const loadCache = () => {
	if (isCacheLoaded) return;
	try {
		const stored = localStorage.getItem(CACHE_KEY_PREFIX);
		if (stored) {
			const parsed = JSON.parse(stored);
			const now = Date.now();
			Object.entries(parsed).forEach(([key, value]: [string, any]) => {
				if (now - value.timestamp < CACHE_TTL) {
					nameCache.set(key, value);
				}
			});
		}
		isCacheLoaded = true;
	} catch (e) {
		console.warn("Failed to load names cache", e);
	}
};

const saveCache = () => {
	try {
		const obj = Object.fromEntries(nameCache.entries());
		localStorage.setItem(CACHE_KEY_PREFIX, JSON.stringify(obj));
	} catch (e) {
		console.warn("Failed to save names cache", e);
	}
};

// Initialize cache immediately
loadCache();

/* =========================================================================
   useNameData - Fetch and manage name data
   ========================================================================= */

interface UseNameDataProps {
	userName?: string | null;
	mode?: "tournament" | "profile";
}

interface UseNameDataResult {
	names: NameItem[];
	isLoading: boolean;
	error: Error | null;
	refetch: () => Promise<void>;
	setNames: (updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => void;
}

export function useNameData({ mode = "tournament" }: UseNameDataProps = {}): UseNameDataResult {
	const [names, setNamesState] = useState<NameItem[]>([]);
	const [isLoading, setIsLoading] = useState(true); // Start loading true to check cache first
	const [error, setError] = useState<Error | null>(null);

	const includeHidden = mode !== "tournament";
	const cacheKey = `${CACHE_KEY_PREFIX}_${includeHidden}`;

	const setNames = useCallback((updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
		setNamesState((previous) => (typeof updater === "function" ? updater(previous) : updater));
	}, []);

	const refetch = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await coreAPI.getTrendingNames(includeHidden);
			const data = Array.isArray(result) ? result : [];

			// Update state
			setNamesState(data);

			// Update cache
			nameCache.set(cacheKey, {
				data,
				timestamp: Date.now(),
			});
			saveCache();
		} catch (fetchError) {
			setError(fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
			// Keep old data if available? For now, clear it to reflect error state or keep previous state?
			// Usually better to keep previous state if it exists, but here we set to empty in original code.
			// Let's stick to original behavior but maybe we can fallback to cache if fetch fails?
			// For now, consistent with original behavior:
			setNamesState([]);
		} finally {
			setIsLoading(false);
		}
	}, [includeHidden, cacheKey]);

	useEffect(() => {
		// Check cache first
		const cached = nameCache.get(cacheKey);
		const now = Date.now();

		if (cached && now - cached.timestamp < CACHE_TTL) {
			setNamesState(cached.data);
			setIsLoading(false);
			// Optional: Background refresh?
		} else {
			void refetch();
		}
	}, [cacheKey, refetch]);

	return {
		names,
		isLoading,
		error,
		refetch,
		setNames,
	};
}

/* =========================================================================
   useNameSelection - Selection state management for names
   ========================================================================= */

interface UseNameSelectionProps {
	names: NameItem[];
	mode?: "tournament" | "profile";
	userName?: string | null;
}

interface UseNameSelectionResult {
	selectedNames: NameItem[];
	selectedIds: Set<string | number>;
	selectedCount: number;
	toggleName: (name: NameItem) => void;
	toggleNameById: (id: string | number) => void;
	toggleNamesByIds: (ids: Array<string | number>) => void;
	selectAll: () => void;
	clearSelection: () => void;
	isSelected: (target: NameItem | string | number) => boolean;
}

export function useNameSelection({
	names,
	mode = "tournament",
	userName,
}: UseNameSelectionProps): UseNameSelectionResult {
	const storageKey = useMemo(
		() => `name_selection_${mode}_${userName ?? "anonymous"}`,
		[mode, userName],
	);

	// Use debounced localStorage hook to prevent main thread blocking on frequent updates
	const [selectedIdsArray, setSelectedIdsArray] = useLocalStorage<(string | number)[]>(
		storageKey,
		[],
		{ debounceWait: 500 },
	);

	// Memoize Set for O(1) lookups
	const selectedIds = useMemo(() => new Set(selectedIdsArray), [selectedIdsArray]);

	const selectedNames = useMemo(
		() => names.filter((name) => selectedIds.has(name.id)),
		[names, selectedIds],
	);

	const isSelected = useCallback(
		(target: NameItem | string | number) => {
			const id = typeof target === "object" ? target.id : target;
			return selectedIds.has(id);
		},
		[selectedIds],
	);

	const toggleNameById = useCallback(
		(id: string | number) => {
			setSelectedIdsArray((prevArray) => {
				const next = new Set(prevArray);
				if (next.has(id)) {
					next.delete(id);
				} else {
					next.add(id);
				}
				return Array.from(next);
			});
		},
		[setSelectedIdsArray],
	);

	const toggleName = useCallback(
		(name: NameItem) => {
			toggleNameById(name.id);
		},
		[toggleNameById],
	);

	const toggleNamesByIds = useCallback(
		(ids: Array<string | number>) => {
			setSelectedIdsArray((prevArray) => {
				const next = new Set(prevArray);
				for (const id of ids) {
					if (next.has(id)) {
						next.delete(id);
					} else {
						next.add(id);
					}
				}
				return Array.from(next);
			});
		},
		[setSelectedIdsArray],
	);

	const clearSelection = useCallback(() => {
		setSelectedIdsArray([]);
	}, [setSelectedIdsArray]);

	const selectAll = useCallback(() => {
		setSelectedIdsArray(names.map((name) => name.id));
	}, [names, setSelectedIdsArray]);

	return {
		selectedNames,
		selectedIds,
		selectedCount: selectedNames.length,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll,
		clearSelection,
		isSelected,
	};
}

/* =========================================================================
   useNameSuggestion - Handle name suggestion form
   ========================================================================= */

interface UseNameSuggestionProps {
	onSuccess?: () => void;
}

interface UseNameSuggestionResult {
	values: {
		name: string;
		description: string;
	};
	errors: {
		name?: string;
		description?: string;
	};
	touched: {
		name?: boolean;
		description?: boolean;
	};
	isSubmitting: boolean;
	isValid: boolean;
	handleChange: (field: "name" | "description", value: string) => void;
	handleBlur: (field: "name" | "description") => void;
	handleSubmit: () => Promise<void>;
	reset: () => void;
	globalError: string;
	successMessage: string;
	setGlobalError: (error: string) => void;
}

export function useNameSuggestion(props: UseNameSuggestionProps = {}): UseNameSuggestionResult {
	const [values, setValues] = useState({ name: "", description: "" });
	const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
	const [touched, setTouched] = useState<{
		name?: boolean;
		description?: boolean;
	}>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [globalError, setGlobalError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	const handleChange = useCallback((field: "name" | "description", value: string) => {
		setValues((prev) => ({ ...prev, [field]: value }));
		setErrors((prev) => ({ ...prev, [field]: undefined }));
		setGlobalError("");
	}, []);

	const handleBlur = useCallback((field: "name" | "description") => {
		setTouched((prev) => ({ ...prev, [field]: true }));
	}, []);

	const validate = useCallback(() => {
		const nextErrors: { name?: string; description?: string } = {};
		if (!values.name.trim()) {
			nextErrors.name = "Name is required";
		}
		if (!values.description.trim()) {
			nextErrors.description = "Description is required";
		}
		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	}, [values]);

	const handleSubmit = useCallback(async () => {
		if (!validate()) {
			return;
		}

		setIsSubmitting(true);
		setGlobalError("");
		setSuccessMessage("");

		try {
			const result = await coreAPI.addName(values.name, values.description);

			if (!result.success) {
				throw new Error(result.error || "Failed to submit suggestion");
			}

			setSuccessMessage("Name suggestion submitted successfully!");
			setValues({ name: "", description: "" });
			setTouched({});
			props.onSuccess?.();
		} catch (submitError) {
			setGlobalError(
				submitError instanceof Error ? submitError.message : "Failed to submit suggestion",
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [props, validate, values.name, values.description]);

	const reset = useCallback(() => {
		setValues({ name: "", description: "" });
		setErrors({});
		setTouched({});
		setGlobalError("");
		setSuccessMessage("");
	}, []);

	const isValid = !errors.name && !errors.description && values.name.trim() !== "";

	return {
		values,
		errors,
		touched,
		isSubmitting,
		isValid,
		handleChange,
		handleBlur,
		handleSubmit,
		reset,
		globalError,
		successMessage,
		setGlobalError,
	};
}
