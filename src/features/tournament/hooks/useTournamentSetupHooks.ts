import { useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NameManagementContextType = any; // Todo: Import proper type from NameManagementView

/**
 * Shared hook for context callbacks
 */
export function useNameManagementCallbacks(context: NameManagementContextType) {
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
