import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/App";
import { Providers } from "@/components/AppChrome";
import { ErrorBoundary } from "@/components/UiPrimitives";
import { queryClient } from "@/lib/api";
import { setupGlobalImageErrorHandler } from "@/lib/utils";
import "@/index.css";

setupGlobalImageErrorHandler();

function registerServiceWorker(): void {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
		return;
	}

	window.addEventListener(
		"load",
		() => {
			navigator.serviceWorker.register("/sw.js").catch((error) => {
				console.warn("Service worker registration failed:", error);
			});
		},
		{ once: true },
	);
}

registerServiceWorker();

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<ErrorBoundary
				context="Application Root"
				onError={(error: Error, errorInfo: React.ErrorInfo) => {
					console.error("Application error:", error, errorInfo);
				}}
			>
				<QueryClientProvider client={queryClient}>
					<Providers>
						<BrowserRouter>
							<App />
						</BrowserRouter>
					</Providers>
				</QueryClientProvider>
			</ErrorBoundary>
		</React.StrictMode>,
	);
}
