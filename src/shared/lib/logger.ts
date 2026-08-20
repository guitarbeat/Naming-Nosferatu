const isDev = () => import.meta.env?.DEV ?? false;

/**
 * Shared logger utility for consistent logging across environments.
 * Logs are only output in development mode to prevent leaking information in production.
 */
export const logger = {
	error: (message?: unknown, ...optionalParams: unknown[]) => {
		if (isDev()) {
			console.error(message, ...optionalParams);
		}
	},
	warn: (message?: unknown, ...optionalParams: unknown[]) => {
		if (isDev()) {
			console.warn(message, ...optionalParams);
		}
	},
	info: (message?: unknown, ...optionalParams: unknown[]) => {
		if (isDev()) {
			console.info(message, ...optionalParams);
		}
	},
	debug: (message?: unknown, ...optionalParams: unknown[]) => {
		if (isDev()) {
			console.debug(message, ...optionalParams);
		}
	},
};
