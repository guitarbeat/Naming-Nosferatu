import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { ErrorBoundary } from "@/features/ui/Error";
import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			gcTime: 10 * 60 * 1000, // 10 minutes
			retry: (failureCount, error: unknown) => {
				if (
					error &&
					typeof error === "object" &&
					"status" in error &&
					(error as { status: number }).status === 404
				) {
					return false;
				}
				return failureCount < 3;
			},
		},
	},
});

interface AppProvidersProps {
	children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
	return (
		<ErrorBoundary context="App Providers">
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>
					<AuthProvider>
						<ToastProvider>{children}</ToastProvider>
					</AuthProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	);
};
