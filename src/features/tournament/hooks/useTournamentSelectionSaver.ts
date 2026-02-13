import { useEffect, useRef } from "react";
import type { NameItem } from "@/types/appTypes";

export function useTournamentSelectionSaver(selectedNames: NameItem[]) {
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const idleCallbackRef = useRef<number | null>(null);
	const lastSavedRef = useRef<string>("");

	useEffect(() => {
		// Clear any pending save
		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
		}
		if (
			idleCallbackRef.current &&
			typeof window !== "undefined" &&
			"cancelIdleCallback" in window
		) {
			window.cancelIdleCallback(idleCallbackRef.current);
			idleCallbackRef.current = null;
		}

		// Optimization: Move hash calculation inside the debounce timeout AND requestIdleCallback.
		// This ensures expensive operations (map/sort/join) are not performed
		// synchronously on every render, but only after the user has stopped interacting,
		// and only when the main thread is idle.
		saveTimeoutRef.current = setTimeout(() => {
			const runHashCalculation = () => {
				const selectionHash = selectedNames
					.map((n) => n.id)
					.sort()
					.join(",");

				if (selectionHash === lastSavedRef.current) {
					return;
				}

				// Simulate save
				// console.log("Saving selection:", selectionHash);
				lastSavedRef.current = selectionHash;
			};

			if (typeof window !== "undefined" && "requestIdleCallback" in window) {
				idleCallbackRef.current = window.requestIdleCallback(runHashCalculation);
			} else {
				runHashCalculation();
			}
		}, 1000);

		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
			if (
				idleCallbackRef.current &&
				typeof window !== "undefined" &&
				"cancelIdleCallback" in window
			) {
				window.cancelIdleCallback(idleCallbackRef.current);
			}
		};
	}, [selectedNames]);
}
