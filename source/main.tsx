import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "@/services/supabase/client";
import App from "./App";
import { AuthProvider } from "./providers/AuthProvider";
import { ToastProvider } from "./providers/ToastProvider";
import "@/styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<ToastProvider>
					<BrowserRouter>
						<App />
						<Analytics />
					</BrowserRouter>
				</ToastProvider>
			</AuthProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
