import { useCallback, useState } from "react";
import { ErrorManager, type FormattedError } from "../services/errorManager";

interface ValidationError {
	field: string;
	message: string;
}

interface UnifiedErrorState {
	error: FormattedError | null;
	isLoading: boolean;
	hasError: boolean;
	validationErrors: ValidationError[];
}

interface UseUnifiedErrorOptions {
	context?: string;
	onError?: (error: FormattedError) => void;
	showToast?: boolean;
}

export const useUnifiedError = (options: UseUnifiedErrorOptions = {}) => {
	const { context = "Unknown", onError, showToast = true } = options;

	const [errorState, setErrorState] = useState<UnifiedErrorState>({
		error: null,
		isLoading: false,
		hasError: false,
		validationErrors: [],
	});

	const handleError = useCallback(
		(error: unknown, metadata: Record<string, unknown> = {}) => {
			const formattedError = ErrorManager.handleError(error, context, metadata);

			setErrorState((prev) => ({
				...prev,
				error: formattedError,
				isLoading: false,
				hasError: true,
			}));

			onError?.(formattedError);

			if (showToast && typeof window !== "undefined") {
				window.dispatchEvent(
					new CustomEvent("show-error-toast", {
						detail: {
							message: formattedError.userMessage,
							severity: formattedError.severity,
						},
					}),
				);
			}

			return formattedError;
		},
		[context, onError, showToast],
	);

	const handleValidationError = useCallback(
		(field: string, message: string) => {
			setErrorState((prev) => ({
				...prev,
				validationErrors: [
					...prev.validationErrors.filter((e) => e.field !== field),
					{ field, message },
				],
				hasError: true,
			}));
		},
		[],
	);

	const clearError = useCallback(() => {
		setErrorState({
			error: null,
			isLoading: false,
			hasError: false,
			validationErrors: [],
		});
	}, []);

	const clearValidationError = useCallback((field: string) => {
		setErrorState((prev) => ({
			...prev,
			validationErrors: prev.validationErrors.filter((e) => e.field !== field),
			hasError:
				prev.error !== null ||
				prev.validationErrors.filter((e) => e.field !== field).length > 0,
		}));
	}, []);

	const setLoading = useCallback((loading: boolean) => {
		setErrorState((prev) => ({ ...prev, isLoading: loading }));
	}, []);

	const executeWithErrorHandling = useCallback(
		async <T>(
			operation: () => Promise<T>,
			metadata: Record<string, unknown> = {},
		): Promise<T | null> => {
			try {
				setLoading(true);
				clearError();
				const result = await operation();
				setLoading(false);
				return result;
			} catch (error) {
				handleError(error, metadata);
				return null;
			}
		},
		[handleError, clearError, setLoading],
	);

	return {
		...errorState,
		handleError,
		handleValidationError,
		clearError,
		clearValidationError,
		setLoading,
		executeWithErrorHandling,
		getFieldError: (field: string) =>
			errorState.validationErrors.find((e) => e.field === field)?.message,
		hasFieldError: (field: string) =>
			errorState.validationErrors.some((e) => e.field === field),
	};
};
