export interface TelemetryAdapter {
	captureException(
		error: Error,
		context: string,
		tags?: Record<string, string>,
		extra?: Record<string, unknown>,
	): void;
	logError(formattedError: { type: string; userMessage: string }, context: string): void;
}

class ConsoleTelemetryAdapter implements TelemetryAdapter {
	captureException(
		error: Error,
		context: string,
		tags?: Record<string, string>,
		extra?: Record<string, unknown>,
	): void {
		console.error(
			"🔴 [Telemetry Exception] Context:",
			context,
			error,
			"Tags:",
			tags,
			"Extra:",
			extra,
		);
	}

	logError(formattedError: { type: string; userMessage: string }, context: string): void {
		console.error(
			`🔴 [Telemetry Error] [${formattedError.type}] Context: ${context}. Msg: ${formattedError.userMessage}`,
		);
	}
}

let activeAdapter: TelemetryAdapter = new ConsoleTelemetryAdapter();

export const registerTelemetryAdapter = (adapter: TelemetryAdapter) => {
	activeAdapter = adapter;
};

export const getTelemetryAdapter = (): TelemetryAdapter => {
	return activeAdapter;
};
