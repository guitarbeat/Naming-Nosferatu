import { useCallback, useEffect, useRef, useState } from "react";

interface UseAsyncDataOptions {
        deps?: unknown[];
}

interface UseAsyncDataResult<T> {
        data: T;
        isLoading: boolean;
        refresh: () => Promise<void>;
}

export function useAsyncData<T>(
        fetcher: () => Promise<T>,
        initialValue: T,
        options: UseAsyncDataOptions = {},
): UseAsyncDataResult<T> {
        const { deps = [] } = options;
        const [data, setData] = useState<T>(initialValue);
        const [isLoading, setIsLoading] = useState(true);
        const fetcherRef = useRef(fetcher);
        fetcherRef.current = fetcher;

        const run = useCallback(async () => {
                setIsLoading(true);
                try {
                        const result = await fetcherRef.current();
                        setData(result);
                } catch (error) {
                        console.error("[useAsyncData] Fetch failed:", error);
                } finally {
                        setIsLoading(false);
                }
        }, []);

        useEffect(() => {
                let isActive = true;
                setIsLoading(true);

                fetcherRef.current()
                        .then((result) => {
                                if (isActive) setData(result);
                        })
                        .catch((error) => {
                                console.error("[useAsyncData] Fetch failed:", error);
                        })
                        .finally(() => {
                                if (isActive) setIsLoading(false);
                        });

                return () => {
                        isActive = false;
                };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, deps);

        return { data, isLoading, refresh: run };
}
