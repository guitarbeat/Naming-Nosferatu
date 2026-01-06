import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { VALIDATION } from "../../../core/constants";
import { useValidatedForm } from "../../../shared/hooks/useValidatedForm";
import { ErrorManager } from "../../../shared/services/errorManager";
import { generateFunName } from "../../../shared/utils/core";

const FALLBACK_CAT_FACT =
	"Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Hook to fetch and manage cat fact state
 */
export function useCatFact() {
	const [catFact, setCatFact] = useState<string | null>(null);

	useEffect(() => {
		const fetchCatFact = async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				REQUEST_TIMEOUT_MS,
			);

			try {
				const response = await fetch(CAT_FACT_API_URL, {
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (data && typeof data.fact === "string") {
					setCatFact(data.fact);
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

// useEyeTracking hook - uses imports from top of file

const EYE_MOVEMENT_MAX_PX = 4;

/**
 * Hook to track mouse position and calculate eye position for cat SVG
 */
export function useEyeTracking({
	catRef,
	catSvgRef,
}: {
	catRef: React.RefObject<HTMLElement | null>;
	catSvgRef: React.RefObject<HTMLElement | null>;
}) {
	const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const target = catSvgRef?.current || catRef?.current;
			if (target) {
				const rect = target.getBoundingClientRect();
				const catCenterX = rect.left + rect.width / 2;
				const catCenterY = rect.top + rect.height / 2;
				const deltaX = e.clientX - catCenterX;
				const deltaY = e.clientY - catCenterY;
				const maxDistance = Math.max(rect.width, rect.height) / 2;
				const normalizedX = Math.max(-1, Math.min(1, deltaX / maxDistance));
				const normalizedY = Math.max(-1, Math.min(1, deltaY / maxDistance));
				setEyePosition({
					x: normalizedX * EYE_MOVEMENT_MAX_PX,
					y: normalizedY * EYE_MOVEMENT_MAX_PX,
				});
			}
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [catRef, catSvgRef]);

	return eyePosition;
}

// useLoginController hook - uses imports from top of file

/**
 * Schema for login form validation
 */
const LoginFormSchema = z.object({
	name: z
		.string()
		.min(
			VALIDATION.MIN_USERNAME_LENGTH || 2,
			"Name must be at least 2 characters",
		)
		.max(
			VALIDATION.MAX_USERNAME_LENGTH || 30,
			"Name must be under 30 characters",
		)
		.regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, - and _ are allowed"),
});

/**
 * Hook to manage login form state and submission
 */
export function useLoginController(
	onLogin: (name: string) => Promise<void> | void,
) {
	const [globalError, setGlobalError] = useState("");
	const catFact = useCatFact();

	const form = useValidatedForm<typeof LoginFormSchema.shape>({
		schema: LoginFormSchema,
		initialValues: { name: "" },
		onSubmit: async (values) => {
			try {
				setGlobalError("");
				await onLogin(values.name);
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
			const savedUser = localStorage.getItem("user-storage");
			if (savedUser) {
				const parsed = JSON.parse(savedUser);
				// Assuming the zustand persist structure: { state: { user: { name: "..." } } }
				const name = parsed?.state?.user?.name;
				if (name && typeof name === "string" && !values.name) {
					setValues({ name });
				}
			}
		} catch (_e) {
			// Ignore storage errors
		}
	}, [setValues, values.name]); // Run once on mount if name is missing

	const handleRandomName = useCallback(() => {
		if (isSubmitting) return;
		const funName = generateFunName();
		setValues({ name: funName });
		if (globalError) setGlobalError("");
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
