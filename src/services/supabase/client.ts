import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

export async function withSupabase<T>(
	operation: (client: any) => Promise<T>,
	fallback: T,
): Promise<T> {
	try {
		const client = await resolveSupabaseClient();
		return await operation(client);
	} catch (error) {
		console.error("API operation failed:", error);
		return fallback;
	}
}

const resolveSupabaseClient = async () => null;

export * from "@/features/analytics/analyticsService";
export * from "./api";
