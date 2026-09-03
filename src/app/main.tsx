import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/shared/api";
import { ErrorBoundary } from "@/shared/components";

import App from "./App";
import { Providers } from "./Providers";

import "../index.css";

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

async function initSentry(): Promise<void> {
	if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
		return;
	}

	try {
		const Sentry = await import("@sentry/react");
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			integrations: [
				Sentry.browserTracingIntegration(),
				Sentry.replayIntegration({
					maskAllText: false,
					blockAllMedia: false,
				}),
			],
			tracesSampleRate: 1.0,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			environment: import.meta.env.MODE,
			release: `name-nosferatu@${import.meta.env.VITE_APP_VERSION || "1.0.2"}`,
		});
	} catch (error) {
		console.warn("Sentry not available, continuing without error tracking:", error);
	}
}

initSentry();

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<ErrorBoundary
			context="Application Root"
			onError={(error: Error, errorInfo: React.ErrorInfo) => {
				// Sentry will automatically capture this through ErrorManager
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
