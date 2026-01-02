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
