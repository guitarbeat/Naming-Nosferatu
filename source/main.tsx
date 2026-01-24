import { queryClient } from "@services/supabase/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ToastProvider } from "./providers/ToastProvider";
import "@styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<ToastProvider>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</ToastProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
