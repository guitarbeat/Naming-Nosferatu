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
	fetcher: () => Promise<T>,
	initialValue: T,
	options: UseAsyncDataOptions = {},
): UseAsyncDataResult<T> {
	const { deps = [] } = options;
	const [data, setData] = useState<T>(initialValue);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const fetcherRef = useRef(fetcher);
	fetcherRef.current = fetcher;

	const run = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await fetcherRef.current();
			setData(result);
		} catch (error) {
			// Errors are typically handled by the consumer
			setError(error instanceof Error ? error : new Error(String(error)));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		let isActive = true;
		setIsLoading(true);
		setError(null);

		fetcherRef
			.current()
			.then((result) => {
				if (isActive) {
					setData(result);
				}
			})
			.catch((error) => {
				if (isActive) {
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
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return { data, isLoading, error, refresh: run };
}
