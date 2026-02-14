/**
 * @module useNames
 * @description Hooks for managing name data, selection, and suggestions
 */

import { useCallback, useMemo, useState } from "react";
import useAppStore from "@/store/appStore";
import type { IdType, NameItem } from "@/shared/types";

/* =========================================================================
   useNameData - Fetch and manage name data
   ========================================================================= */

interface UseNameDataProps {
	userName: string | null;
	mode: "tournament" | "management";
}

interface UseNameDataResult {
	names: NameItem[];
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
	setNames: (names: NameItem[]) => void;
}

export function useNameData(_props: UseNameDataProps): UseNameDataResult {
	const { tournament, tournamentActions } = useAppStore();
	const [isLoading, setIsLoading] = useState(false);
	const [error, _setError] = useState<string | null>(null);

	const names = tournament.names || [];

	const refetch = useCallback(async () => {
		setIsLoading(true);
		try {
			const { coreAPI } = await import("@/services/supabase/client");
			const fetchedNames = await coreAPI.getTrendingNames(false);
			if (tournamentActions?.setNames) {
				tournamentActions.setNames(fetchedNames);
			}
		} catch (err) {
			console.error("Failed to fetch names:", err);
		} finally {
			setIsLoading(false);
		}
	}, [tournamentActions]);

	const setNames = useCallback(
		(newNames: NameItem[]) => {
			if (tournamentActions?.setNames) {
				tournamentActions.setNames(newNames);
			}
		},
		[tournamentActions],
	);

	return {
		names,
		isLoading,
		error,
		refetch,
		setNames,
	};
}

/* =========================================================================
   useNameSelection - Manage name selection state
   ========================================================================= */

interface UseNameSelectionProps {
	names: NameItem[];
	mode: "tournament" | "management";
	userName: string | null;
}

interface UseNameSelectionResult {
	selectedNames: NameItem[];
	selectedIds: Set<IdType>;
	toggleName: (name: NameItem) => void;
	toggleNameById: (id: IdType) => void;
	toggleNamesByIds: (ids: IdType[]) => void;
	selectAll: () => void;
	selectedCount: number;
	clearSelection: () => void;
	isSelected: (id: IdType) => boolean;
}

export function useNameSelection({ names }: UseNameSelectionProps): UseNameSelectionResult {
	const { tournament, tournamentActions } = useAppStore();

	// Get locked-in names and automatically include them
	const lockedInNames = useMemo(() => names.filter(name => name.lockedIn || name.locked_in), [names]);
	const lockedInIds = useMemo(() => new Set(lockedInNames.map(n => n.id)), [lockedInNames]);

	// Use store selection for tournament mode, local state for management mode
	const selectedNames = tournament.selectedNames || [];

	// Ensure all locked-in names are always selected
	const finalSelectedNames = useMemo(() => {
		const selectedIds = new Set(selectedNames.map(n => n.id));
		const missingLockedIn = lockedInNames.filter(name => !selectedIds.has(name.id));
		return [...selectedNames, ...missingLockedIn];
	}, [selectedNames, lockedInNames]);

	const selectedIds: Set<IdType> = new Set(finalSelectedNames.map((n) => n.id));
	const selectedCount = finalSelectedNames.length;

	const toggleName = useCallback(
		(name: NameItem) => {
			if (tournamentActions?.setSelection) {
				// Prevent toggling locked-in names
				if (lockedInIds.has(name.id)) {
					return;
				}
				
				const isCurrentlySelected = selectedIds.has(name.id);
				const newSelection = isCurrentlySelected
					? selectedNames.filter((n) => n.id !== name.id)
					: [...selectedNames, name];
				tournamentActions.setSelection(newSelection);
			}
		},
		[tournamentActions, selectedIds, selectedNames, lockedInIds],
	);

	const toggleNameById = useCallback(
		(id: IdType) => {
			const name = names.find((n) => n.id === id);
			if (name) {
				toggleName(name);
			}
		},
		[names, toggleName],
	);

	const toggleNamesByIds = useCallback(
		(ids: IdType[]) => {
			if (tournamentActions?.setSelection) {
				const idsSet = new Set(ids);
				const currentlySelectedIds = new Set(selectedNames.map((n) => n.id));
				const newSelection = names.filter((n) => {
					const wasSelected = currentlySelectedIds.has(n.id);
					const shouldToggle = idsSet.has(n.id);
					return shouldToggle ? !wasSelected : wasSelected;
				});
				tournamentActions.setSelection(newSelection);
			}
		},
		[tournamentActions, selectedNames, names],
	);

	const selectAll = useCallback(() => {
		if (tournamentActions?.setSelection) {
			tournamentActions.setSelection([...names]);
		}
	}, [tournamentActions, names]);

	const clearSelection = useCallback(() => {
		if (tournamentActions?.setSelection) {
			// Clear all non-locked-in names, but keep locked-in names
			tournamentActions.setSelection(lockedInNames);
		}
	}, [tournamentActions, lockedInNames]);

	const isSelected = useCallback((id: IdType) => selectedIds.has(id), [selectedIds]);

	return {
		selectedNames: finalSelectedNames,
		selectedIds,
		toggleName,
		toggleNameById,
		toggleNamesByIds,
		selectAll,
		selectedCount,
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
		const newErrors: { name?: string; description?: string } = {};
		if (!values.name.trim()) {
			newErrors.name = "Name is required";
		}
		if (!values.description.trim()) {
			newErrors.description = "Description is required";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	}, [values]);

	const handleSubmit = useCallback(async () => {
		if (!validate()) {
			return;
		}

		setIsSubmitting(true);
		setGlobalError("");
		setSuccessMessage("");

		try {
			// TODO: Implement actual submission to Supabase
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setSuccessMessage("Name suggestion submitted successfully!");
			setValues({ name: "", description: "" });
			setTouched({});
			props.onSuccess?.();
		} catch (err) {
			setGlobalError(err instanceof Error ? err.message : "Failed to submit suggestion");
		} finally {
			setIsSubmitting(false);
		}
	}, [validate, props]);

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
