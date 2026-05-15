import { useCallback } from "react";

// Shared hook for deferred sync to prevent render cycle issues
export const useDeferredSync = () => {
        const deferredSync = useCallback((syncFn: () => void) => {
                setTimeout(syncFn, 0);
        }, []);

        return deferredSync;
};
