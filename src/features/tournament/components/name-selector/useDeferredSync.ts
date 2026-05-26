import { useCallback } from "react";

export const useDeferredSync = () => {
	const deferredSync = useCallback((syncFn: () => void) => {
		setTimeout(syncFn, 0);
	}, []);

	return deferredSync;
};
