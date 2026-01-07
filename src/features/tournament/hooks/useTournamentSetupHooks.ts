import { useCallback } from "react";
import type { UseNameManagementViewResult } from "../../../shared/components/NameManagementView/nameManagementCore";
import type { NameItem } from "../../../types/components";

/**
 * Shared hook for context callbacks
 */
export function useNameManagementCallbacks(context: UseNameManagementViewResult | null) {
	const setHiddenNames = useCallback(
		(_updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
			// TODO: Implement when context provides setHiddenIds method
			// context?.setHiddenIds?.(updater);
		},
		[],
	);

	const setAllNames = useCallback((_updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
		// TODO: Implement when context provides setNames method
		// context?.setNames?.(updater);
	}, []);

	const fetchNames = useCallback(() => {
		context?.refetch?.();
	}, [context]);

	return { setHiddenNames, setAllNames, fetchNames };
}
