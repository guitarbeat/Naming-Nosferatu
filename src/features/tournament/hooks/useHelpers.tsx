/**
 * @module useHelpers
 * @description Consolidated tournament helper hooks
 * Combines: useAudioManager, useTournamentSelectionSaver, useProfileNotifications
 */

import { useCallback, useRef, useState } from "react";
import { Toast } from "@/layout";
import { useToast } from "@/providers/Providers";
import type { NameItem } from "@/types/appTypes";
import { devError, devLog } from "@/utils/basic";
import { NOTIFICATION } from "@/utils/constants";

/* =========================================================================
   AUDIO MANAGER HOOK
   ========================================================================= */

export function useAudioManager() {
	const [isMuted, setIsMuted] = useState(true);
	const [volume, setVolume] = useState(0.2);
	return {
		playAudioTrack: () => {
			/* No-op: handled by external audio services if available */
		},
		isMuted,
		handleToggleMute: () => setIsMuted((p) => !p),
		handleNextTrack: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		isShuffle: false,
		handleToggleShuffle: () => {
			/* No-op: logic not implemented for simple tournaments */
		},
		currentTrack: null,
		trackInfo: null,
		audioError: null,
		retryAudio: () => {
			/* No-op: handled by external audio services if available */
		},
		volume,
		handleVolumeChange: (_unused: unknown, v: number) =>
			setVolume(Math.min(1, Math.max(0, v))),
	};
}

/* =========================================================================
   TOURNAMENT SELECTION SAVER HOOK
   ========================================================================= */

interface UseTournamentSelectionSaverProps {
	userName: string | null;
	enableAutoSave?: boolean;
}

/**
 * Hook for auto-saving tournament selections
 * Debounces save operations to avoid excessive API calls
 */
export function useTournamentSelectionSaver({
	userName,
	enableAutoSave = true,
}: UseTournamentSelectionSaverProps) {
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedRef = useRef<string>("");

	const scheduleSave = useCallback(
		(selectedNames: NameItem[]) => {
			if (!userName || !enableAutoSave) {
				return;
			}

			// Clear any pending save
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// Create a hash of the current selection to detect changes
			const selectionHash = selectedNames
				.map((n) => n.id)
				.sort()
				.join(",");
			if (selectionHash === lastSavedRef.current) {
				return;
			}

			// Debounce the save operation
			saveTimeoutRef.current = setTimeout(async () => {
				try {
					// Save to localStorage as a simple persistence mechanism
					localStorage.setItem(
						`tournament_selection_${userName}`,
						JSON.stringify(selectedNames.map((n) => n.id)),
					);
					lastSavedRef.current = selectionHash;
				} catch (error) {
					console.error("Failed to save tournament selection:", error);
				}
			}, 1000);
		},
		[userName, enableAutoSave],
	);

	const loadSavedSelection = useCallback(() => {
		if (!userName) {
			return [];
		}
		try {
			const saved = localStorage.getItem(`tournament_selection_${userName}`);
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	}, [userName]);

	return {
		scheduleSave,
		loadSavedSelection,
	};
}

/* =========================================================================
   PROFILE NOTIFICATIONS HOOK
   ========================================================================= */

/**
 * Hook for profile notification functions with toast UI
 * @returns {Object} Notification functions and Toast component
 */
export function useProfileNotifications() {
	const {
		toasts,
		showSuccess: showSuccessToast,
		showError: showErrorToast,
		showToast: showToastMessage,
		removeToast,
	} = useToast();

	const showSuccess = useCallback(
		(message: string) => {
			devLog("✅", message);
			showSuccessToast(message, { duration: 5000 });
		},
		[showSuccessToast],
	);

	const showError = useCallback(
		(message: string) => {
			devError("❌", message);
			showErrorToast(message, { duration: NOTIFICATION.ERROR_DURATION_MS });
		},
		[showErrorToast],
	);

	const showToast = useCallback(
		(
			message: string,
			type: "success" | "error" | "info" | "warning" = "info",
		) => {
			devLog(`📢 [${type}]`, message);
			showToastMessage(message, type, {
				duration: type === "error" ? 7000 : 5000,
			});
		},
		[showToastMessage],
	);

	const ToastContainer = useCallback(() => {
		return (
			<Toast
				variant="container"
				toasts={toasts}
				removeToast={removeToast}
				position="top-right"
				maxToasts={NOTIFICATION.MAX_TOASTS}
				onDismiss={() => {
					// Intentional no-op: dismiss handled by component
				}}
				message=""
			/>
		);
	}, [toasts, removeToast]);

	return {
		showSuccess,
		showError,
		showToast,
		ToastContainer,
	};
}
