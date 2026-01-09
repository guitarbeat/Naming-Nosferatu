import { useCallback } from "react";
import type { UseNameManagementViewResult } from "../../../shared/components/NameManagementView/nameManagementCore";
import type { NameItem } from "../../../types/components";

/**
 * Shared hook for context callbacks
 */
export function useNameManagementCallbacks(context: UseNameManagementViewResult | null) {
	const setHiddenNames = useCallback(
		(updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
			if (!context) {
				return;
			}
			const currentNames = typeof updater === "function" ? updater(context.names) : updater;
			const hiddenIds = new Set(
				currentNames.filter((n) => n.isHidden || n.is_hidden).map((n) => n.id),
			);
			context.setHiddenIds(hiddenIds);
		},
		[context],
	);

	const setAllNames = useCallback(
		(updater: NameItem[] | ((prev: NameItem[]) => NameItem[])) => {
			context?.setNames(updater);
		},
		[context],
	);

	const fetchNames = useCallback(() => {
		context?.refetch();
	}, [context]);

	return { setHiddenNames, setAllNames, fetchNames };
}
