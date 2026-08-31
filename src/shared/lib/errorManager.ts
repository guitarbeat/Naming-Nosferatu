import { addToast } from "@heroui/react";

export interface HandledError {
	id: string;
	message: string;
	context?: string;
	metadata?: Record<string, unknown>;
}

export class ErrorManager {
	static setupGlobalErrorHandling() {
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error("Unhandled Promise Rejection:", event.reason);
			ErrorManager.handleError(event.reason, "unhandledrejection");
		};

		const handleErrorEvent = (event: ErrorEvent) => {
			console.error("Global Error:", event.error);
			ErrorManager.handleError(event.error, "window.error");
		};

		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		window.addEventListener("error", handleErrorEvent);

		return () => {
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
			window.removeEventListener("error", handleErrorEvent);
		};
	}

	static handleError(
		error: unknown,
		context?: string,
		metadata?: Record<string, unknown>,
	): HandledError {
		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		const handled: HandledError = {
			id: `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
			message,
			context,
			metadata,
		};

		console.error(`[${context ?? "Error"}]`, error, metadata);

		try {
			addToast({
				title: context ?? "Error",
				description: message,
				color: "danger",
			});
		} catch {
			// Toast provider may be unmounted during boot or teardown.
		}

		return handled;
	}
}
