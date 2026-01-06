import { useCallback, useEffect, useState } from "react";
import { gracefulDegradation } from "../utils/errorHandling";

interface OfflineQueueItem {
	id: string;
	operation: () => Promise<unknown>;
	context: string;
	timestamp: number;
	retryCount: number;
}

export const useOfflineSupport = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [queuedOperations, setQueuedOperations] = useState<OfflineQueueItem[]>(
		[],
	);

	const processQueue = useCallback(async () => {
		if (!isOnline || queuedOperations.length === 0) return;

		const processedIds: string[] = [];

		for (const item of queuedOperations) {
			try {
				await item.operation();
				processedIds.push(item.id);
				console.log(`✅ Processed offline operation: ${item.context}`);
			} catch (error) {
				console.warn(
					`❌ Failed to process offline operation: ${item.context}`,
					error,
				);

				// Retry logic
				if (item.retryCount < 3) {
					setQueuedOperations((prev) =>
						prev.map((op) =>
							op.id === item.id ? { ...op, retryCount: op.retryCount + 1 } : op,
						),
					);
				} else {
					// Remove after max retries
					processedIds.push(item.id);
				}
			}
		}

		// Remove processed operations
		if (processedIds.length > 0) {
			setQueuedOperations((prev) => {
				const newQueue = prev.filter((item) => !processedIds.includes(item.id));
				gracefulDegradation.storage.set("offline-queue", newQueue);
				return newQueue;
			});
		}
	}, [isOnline, queuedOperations]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: prevent infinite loop
	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			// Use setTimeout to avoid potential infinite loops
			setTimeout(() => processQueue(), 0);
		};

		const handleOffline = () => {
			setIsOnline(false);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Load queued operations from storage on mount only
		const savedQueue = gracefulDegradation.storage.get("offline-queue", []);
		if (savedQueue.length > 0) {
			setQueuedOperations(savedQueue);
		}

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []); // Remove processQueue dependency to avoid infinite loop

	const queueOperation = (
		operation: () => Promise<unknown>,
		context: string,
	): string => {
		const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
		const queueItem: OfflineQueueItem = {
			id,
			operation,
			context,
			timestamp: Date.now(),
			retryCount: 0,
		};

		setQueuedOperations((prev) => {
			const newQueue = [...prev, queueItem];
			gracefulDegradation.storage.set("offline-queue", newQueue);
			return newQueue;
		});

		return id;
	};

	const executeWithOfflineSupport = async <T>(
		operation: () => Promise<T>,
		context: string,
	): Promise<T | null> => {
		if (isOnline) {
			try {
				return await operation();
			} catch (error) {
				// If online but operation fails, queue it for retry
				queueOperation(operation, context);
				throw error;
			}
		} else {
			// Queue operation for when we're back online
			queueOperation(operation, context);
			throw new Error("Operation queued for when connection is restored");
		}
	};

	return {
		isOnline,
		queuedOperations: queuedOperations.length,
		executeWithOfflineSupport,
		processQueue,
	};
};
