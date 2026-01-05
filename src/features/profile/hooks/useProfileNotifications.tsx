/**
 * @module useProfileNotifications
 * @description Custom hook for profile notification functions with visible toast notifications.
 */

import { useCallback } from "react";
import { NOTIFICATION } from "../../../core/constants";
import { Toast } from "../../../shared/components/CommonUI";
import { useToast } from "../../../shared/hooks/useAppHooks";
import { devError, devLog } from "../../../shared/utils/core";

/**
 * * Hook for profile notification functions with toast UI
 * @returns {Object} Notification functions and Toast component
 */
// ts-prune-ignore-next (used in TournamentSetup)
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
			showToastMessage({
				message,
				type,
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
				onDismiss={() => {}}
				message=""
			/>
		);
	}, [toasts, removeToast]);

	return { showSuccess, showError, showToast, ToastContainer };
}
