import { useCallback, useEffect, useRef, useState } from "react";

interface UseAsyncDataOptions {
	deps?: unknown[];
}

interface UseAsyncDataResult<T> {
	data: T;
	isLoading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useAsyncData<T>(
	fetcher: (signal?: AbortSignal) => Promise<T>,
	initialValue: T,
	options: UseAsyncDataOptions = {},
): UseAsyncDataResult<T> {
	const { deps = [] } = options;
	const [data, setData] = useState<T>(initialValue);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;

	const abortRef = useRef<AbortController | null>(null);

	const run = useCallback(async () => {
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;
		setIsLoading(true);
		setError(null);
		try {
			const result = await fetcherRef.current(controller.signal);
			if (!controller.signal.aborted) {
				setData(result);
			}
		} catch (error) {
			if (!controller.signal.aborted) {
				setError(error instanceof Error ? error : new Error(String(error)));
			}
		} finally {
			if (!controller.signal.aborted) {
				setIsLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		let isActive = true;
		const controller = new AbortController();
		setIsLoading(true);
		setError(null);

		fetcherRef
			.current(controller.signal)
			.then((result) => {
				if (isActive) {
					setData(result);
				}
			})
			.catch((error) => {
				if (isActive && error?.name !== "AbortError") {
					setError(error instanceof Error ? error : new Error(String(error)));
				}
			})
			.finally(() => {
				if (isActive) {
					setIsLoading(false);
				}
			});

		return () => {
			isActive = false;
			controller.abort();
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: caller supplies dependency list
	}, deps);

	return { data, isLoading, error, refresh: run };
}
