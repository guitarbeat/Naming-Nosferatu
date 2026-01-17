import { useMemo } from "react";

/**
 * Custom hook to get a time-based greeting.
 * @returns {string} A greeting string: "Good morning", "Good afternoon", or "Good evening".
 */
export function useGreeting(): string {
	return useMemo(() => {
		const hour = new Date().getHours();
		if (hour < 12) {
			return "Good morning";
		}
		if (hour < 18) {
			return "Good afternoon";
		}
		return "Good evening";
	}, []);
}
