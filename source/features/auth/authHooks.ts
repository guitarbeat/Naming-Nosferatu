import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { STORAGE_KEYS, VALIDATION } from "@/constants";
import { useValidatedForm } from "@/hooks/useValidatedForm";
import { ErrorManager } from "@/services/errorManager";
import { generateFunName } from "@/utils";
import { playSound } from "@/utils/soundManager";
import { isUserAdmin } from "./authUtils";

const FALLBACK_CAT_FACT = "Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;

// ============================================================================
// Admin Status Hook
// ============================================================================

/**
 * Custom hook for checking if a user is an admin
 * @param userName - User name to check
 * @returns { isAdmin, isLoading, error }
 */
export function useAdminStatus(userName: string | null) {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		let isMounted = true;

		const checkAdminStatus = async () => {
			if (!userName) {
				if (isMounted) {
					setIsAdmin(false);
					setIsLoading(false);
				}
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const adminStatus = await isUserAdmin(userName);
				if (isMounted) {
					setIsAdmin(adminStatus);
				}
			} catch (err) {
				if (isMounted) {
					if (process.env.NODE_ENV === "development") {
						console.error("Error checking admin status:", err);
					}
					setIsAdmin(false);
					setError(err);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		checkAdminStatus();

		return () => {
			isMounted = false;
		};
	}, [userName]);

	return { isAdmin, isLoading, error };
}

/**
 * Hook to fetch and manage cat fact state
 */
function useCatFact() {
	const [catFact, setCatFact] = useState<string | null>(null);

	useEffect(() => {
		const fetchCatFact = async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

			try {
				const response = await fetch(CAT_FACT_API_URL, {
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const catFactData = await response.json();

				if (catFactData && typeof catFactData.fact === "string") {
					setCatFact(catFactData.fact);
				} else {
					throw new Error("Invalid response format from cat fact API");
				}
			} catch (error: unknown) {
				const err = error as Error;
				if (err.name === "AbortError" || err.name === "TimeoutError") {
					// Silent fail for timeouts
				} else {
					ErrorManager.handleError(error, "Fetch Cat Fact", {
						isRetryable: true,
						affectsUserData: false,
						isCritical: false,
					});
				}
				setCatFact(FALLBACK_CAT_FACT);
			}
		};

		fetchCatFact();
	}, []);

	return catFact;
}

// useLoginController hook - uses imports from top of file

/**
 * Schema for login form validation
 */
const LoginFormSchema = z.object({
	name: z
		.string()
		.min(VALIDATION.MIN_USERNAME_LENGTH || 2, "Name must be at least 2 characters")
		.max(VALIDATION.MAX_USERNAME_LENGTH || 30, "Name must be under 30 characters")
		.regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ are allowed"),
});

/**
 * Hook to manage login form state and submission
 */
export function useLoginController(onLogin: (name: string) => Promise<void> | void) {
	const [globalError, setGlobalError] = useState("");
	const catFact = useCatFact();

	const form = useValidatedForm<typeof LoginFormSchema.shape>({
		schema: LoginFormSchema,
		initialValues: { name: "" },
		onSubmit: async (values: z.infer<typeof LoginFormSchema>) => {
			try {
				setGlobalError("");
				await onLogin(values.name);
				// Play success sound for login
				playSound("level-up");
			} catch (err) {
				const formattedError = ErrorManager.handleError(err, "User Login", {
					isRetryable: true,
					affectsUserData: false,
					isCritical: false,
				});

				const error = err as Error;
				setGlobalError(
					formattedError.userMessage ||
						error.message ||
						"Unable to log in. Please check your connection and try again.",
				);
				throw err; // Re-throw to let the hook know submission failed
			}
		},
	});

	const {
		values,
		errors,
		touched,
		isSubmitting,
		handleChange,
		handleBlur,
		handleSubmit,
		setValues,
	} = form;

	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleChange("name", e.target.value);
			if (globalError) {
				setGlobalError("");
			}
		},
		[handleChange, globalError],
	);

	// * Smart Default: Check for saved username on mount
	useEffect(() => {
		try {
			// Basic localStorage check - in a real app this might simpler or more complex
			// depending on the auth system. Since this is a simple name-based login:
			const savedUser = localStorage.getItem(STORAGE_KEYS.USER_STORAGE);
			if (savedUser) {
				const parsed = JSON.parse(savedUser);
				// Assuming the zustand persist structure: { state: { user: { name: "..." } } }
				const name = parsed?.state?.user?.name;
				if (name && typeof name === "string" && !values.name) {
					setValues({ name });
				}
			}
		} catch {
			// Ignore storage errors
		}
	}, [setValues, values.name]); // Run once on mount if name is missing

	const handleRandomName = useCallback(() => {
		if (isSubmitting) {
			return;
		}
		const funName = generateFunName();
		setValues({ name: funName });
		if (globalError) {
			setGlobalError("");
		}
		// Play surprise sound for random name generation
		playSound("surprise");
	}, [isSubmitting, globalError, setValues]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				void handleSubmit();
			}
		},
		[handleSubmit],
	);

	return {
		name: values.name,
		setName: (val: string) => setValues({ name: val }),
		isLoading: isSubmitting,
		error: errors.name || globalError,
		touched: touched.name,
		handleNameChange,
		handleBlur,
		handleSubmit,
		handleRandomName,
		handleKeyDown,
		clearError: () => setGlobalError(""),
		catFact,
		// Expose schema for the input component
		nameSchema: LoginFormSchema.shape.name,
	};
}
