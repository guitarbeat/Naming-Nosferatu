/**
 * @module useBrowserState
 * @description Re-exports browser-related hooks from useHooks for backward compatibility.
 *
 * Also provides `useOfflineSync` as a thin wrapper around `useOnlineStatus`
 * for consumers that depend on the legacy API.
 */

export { useBrowserState, useOnlineStatus } from "./useHooks";

/**
 * Legacy offline-sync hook.
 *
 * In the original codebase this directly imported a sync queue and API
 * client. Now it delegates to `useOnlineStatus` — consumers should pass
 * their own `onReconnect` callback to handle queue flushing.
 *
 * @example
 * useOfflineSync(); // no-op by default; attach sync logic via useOnlineStatus
 */
export function useOfflineSync(): void {
	// No-op stub — replace with `useOnlineStatus({ onReconnect: () => syncQueue.flush() })`
	// when you have a real sync queue wired up.
}
