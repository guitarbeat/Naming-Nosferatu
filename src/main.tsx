import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { queryClient } from "./shared/services/supabase/queryClient";
import "@styles/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</QueryClientProvider>
	</React.StrictMode>,
);
