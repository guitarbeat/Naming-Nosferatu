import { useEffect, useState } from "react";
import { ErrorManager } from "../../../shared/services/errorManager";

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
