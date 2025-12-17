/**
 * @module useCatFact
 * @description Hook for fetching cat facts from external API
 */

import { useState, useEffect } from "react";
import { ErrorManager } from "../../../shared/services/errorManager";

const FALLBACK_CAT_FACT =
  "Cats are amazing creatures with unique personalities!";
const CAT_FACT_API_URL = "https://catfact.ninja/fact";
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Hook to fetch and manage cat fact state
 * @returns {string} The cat fact or empty string while loading
 */
export function useCatFact() {
  const [catFact, setCatFact] = useState("");

  useEffect(() => {
    const fetchCatFact = async () => {
      // * Create abort controller for timeout
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

        // * Validate response structure
        if (data && typeof data.fact === "string") {
          setCatFact(data.fact);
        } else {
          throw new Error("Invalid response format from cat fact API");
        }
      } catch (error) {
        // * Handle abort/timeout gracefully
        if (error.name === "AbortError" || error.name === "TimeoutError") {
          if (process.env.NODE_ENV === "development") {
            console.warn("Cat fact request timed out");
          }
        } else {
          // * Use ErrorManager for consistent error handling
          ErrorManager.handleError(error, "Fetch Cat Fact", {
            isRetryable: true,
            affectsUserData: false,
            isCritical: false,
          });
        }

        // * Set fallback message
        setCatFact(FALLBACK_CAT_FACT);
      }
    };

    fetchCatFact();
  }, []);

  return catFact;
}
