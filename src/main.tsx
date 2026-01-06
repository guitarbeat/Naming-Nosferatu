import { HeroUIProvider } from "@heroui/react";
import { QueryClientProvider } from "@tanstack/react-query";
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
		<HeroUIProvider>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</HeroUIProvider>
	</React.StrictMode>,
);
