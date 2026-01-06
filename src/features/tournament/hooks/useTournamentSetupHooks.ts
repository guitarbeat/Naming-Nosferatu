import { useCallback } from "react";
import type { UseNameManagementViewResult } from "../../../shared/components/NameManagementView/nameManagementCore";

/**
 * Shared hook for context callbacks
 */
export function useNameManagementCallbacks(context: UseNameManagementViewResult | null) {
	const setHiddenNames = useCallback(
		(updater: unknown) => {
			context?.setHiddenIds?.(updater);
		},
		[context],
	);

	const setAllNames = useCallback(
		(updater: unknown) => {
			context?.setNames?.(updater);
		},
		[context],
	);

	const fetchNames = useCallback(() => {
		context?.refetch?.();
	}, [context]);

	return { setHiddenNames, setAllNames, fetchNames };
}
