import { toast } from "@heroui/react";

export class ErrorManager {
	static setupGlobalErrorHandling() {
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error("Unhandled Promise Rejection:", event.reason);
			ErrorManager.handleError(event.reason);
		};

		const handleErrorEvent = (event: ErrorEvent) => {
			console.error("Global Error:", event.error);
			ErrorManager.handleError(event.error);
		};

		window.addEventListener("unhandledrejection", handleUnhandledRejection);
		window.addEventListener("error", handleErrorEvent);

		return () => {
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
			window.removeEventListener("error", handleErrorEvent);
		};
	}

	static handleError(error: unknown) {
		const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
		toast(errorMessage);
	}
}
