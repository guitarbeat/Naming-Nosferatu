const isDev = import.meta.env?.DEV || process.env.NODE_ENV === "development";

export const noop = (..._args: unknown[]) => {};

export const devLog = isDev
	? (...args: unknown[]) => console.log("[DEV]", ...args)
	: noop;
export const devWarn = isDev
	? (...args: unknown[]) => console.warn("[DEV]", ...args)
	: noop;
export const devError = isDev
	? (...args: unknown[]) => console.error("[DEV]", ...args)
	: noop;
