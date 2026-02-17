import { createClient } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
		return await operation(supabase);
	} catch (error) {
		console.error("API operation failed:", error);
		return fallback;
	}
}

export * from "@/features/analytics/analyticsService";
export * from "./api";
