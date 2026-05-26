import type { TelemetryAdapter } from "../telemetrySeam";

export class SentryTelemetryAdapter implements TelemetryAdapter {
	private getGlobalSentry() {
		const g = (
			typeof globalThis === "undefined" ? (typeof window === "undefined" ? {} : window) : globalThis
		) as typeof globalThis & {
			Sentry?: { captureException?: (error: Error, options?: unknown) => void };
		};
		return g.Sentry;
	}

	captureException(
		error: Error,
		context: string,
		tags?: Record<string, string>,
		extra?: Record<string, unknown>,
	): void {
		const sentry = this.getGlobalSentry();
		if (sentry?.captureException) {
			sentry.captureException(error, {
				tags: {
					context,
					...tags,
				},
				extra,
			});
		}
	}

	logError(formattedError: { type: string; userMessage: string }, context: string): void {
		// Log structured error context in dev or non-production environment
		if (process.env.NODE_ENV === "development") {
			console.group(`🔴 Error [${formattedError.type}]`);
			console.error("Context:", context, "Message:", formattedError.userMessage);
			console.groupEnd();
		}
	}
}
