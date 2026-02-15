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

export const isSupabaseAvailable = async () => true;

export async function withSupabase<T>(
	operation: (client: any) => Promise<T>,
	fallback: T,
): Promise<T> {
	try {
		return await operation(null);
	} catch (error) {
		console.error("API operation failed:", error);
		return fallback;
	}
}

export const updateSupabaseUserContext = (_userName: string | null): void => {};

export const resolveSupabaseClient = async () => null;
export const supabase = resolveSupabaseClient;

export * from "@/features/analytics/analyticsService";
export * from "./api";
