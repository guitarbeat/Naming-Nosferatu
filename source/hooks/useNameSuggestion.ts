import { coreAPI } from "@supabase/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { VALIDATION } from "@/constants";
import { useToast } from "@/providers/ToastProvider";
import { ErrorManager } from "@/services/errorManager";
import useAppStore from "@/store/useAppStore";
import { useValidatedForm } from "./useValidatedForm";

/**
 * Schema for name suggestion form validation
 */
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

/**
 * Hook to manage name suggestion logic for both inline and modal variants
 */
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
