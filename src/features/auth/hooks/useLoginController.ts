import { useCallback, useState } from "react";
import { ErrorManager } from "../../../shared/services/errorManager";
import { generateFunName, validateUsername } from "../../../shared/utils/core";
import { useCatFact } from "./useCatFact";

/**
 * Hook to manage login form state and submission
 */
export function useLoginController(
	onLogin: (name: string) => Promise<void> | void,
) {
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const catFact = useCatFact();

	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setName(e.target.value);
			if (error) {
				setError("");
			}
		},
		[error],
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
			e.preventDefault();

			if (isLoading) {
				return;
			}

			const finalName = name.trim() || generateFunName();

			const validation = validateUsername(finalName);
			if (!validation.success) {
				setError(validation.error || "Invalid username");
				return;
			}

			try {
				setIsLoading(true);
				setError("");
				await onLogin(validation.value || finalName);
			} catch (err) {
				const formattedError = ErrorManager.handleError(err, "User Login", {
					isRetryable: true,
					affectsUserData: false,
					isCritical: false,
				});

				const error = err as Error;
				setError(
					formattedError.userMessage ||
						error.message ||
						"Unable to log in. Please check your connection and try again.",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[name, isLoading, onLogin],
	);

	const clearError = useCallback(() => {
		setError("");
	}, []);

	const handleRandomName = useCallback(() => {
		if (isLoading) return;
		const funName = generateFunName();
		setName(funName);
		if (error) setError("");
	}, [isLoading, error]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				void handleSubmit(e);
			}
		},
		[handleSubmit],
	);

	return {
		name,
		setName,
		isLoading,
		error,
		handleNameChange,
		handleSubmit,
		handleRandomName,
		handleKeyDown,
		clearError,
		catFact,
	};
}
