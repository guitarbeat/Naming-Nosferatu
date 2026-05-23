export interface AnalyticsEnv {
	hostname: string;
	isProd: boolean;
}

export function shouldEnableAnalytics({ hostname, isProd }: AnalyticsEnv): boolean {
	if (!isProd) {
		return false;
	}

	const isLocalhost =
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname.endsWith(".replit.dev") ||
		hostname.includes("local");

	return !isLocalhost;
}
