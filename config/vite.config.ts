import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { consoleForwardPlugin } from "../scripts/vite-console-forward-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPackageName(id: string): string | null {
	const modulePath = id.split("node_modules/").pop();
	if (!modulePath) {
		return null;
	}

	const parts = modulePath.split("/");
	if (parts[0]?.startsWith("@") && parts[1]) {
		return `${parts[0]}/${parts[1]}`;
	}

	return parts[0] ?? null;
}

function getManualChunk(id: string): string | undefined {
	if (!id.includes("node_modules")) {
		return undefined;
	}

	const packageName = getPackageName(id);
	if (!packageName) {
		return "vendor";
	}

	if (
		[
			"react",
			"react-dom",
			"react-router",
			"react-router-dom",
			"@remix-run/router",
			"scheduler",
			"hoist-non-react-statics",
			"react-is",
			"react-redux",
			"redux",
			"use-sync-external-store",
		].includes(packageName)
	) {
		return "react-vendor";
	}

	if (packageName.startsWith("@sentry/") || packageName.startsWith("@sentry-internal/")) {
		return "sentry-vendor";
	}

	if (
		packageName === "framer-motion" ||
		packageName === "motion-dom" ||
		packageName === "motion-utils"
	) {
		return "motion-vendor";
	}

	if (packageName === "ogl") {
		return "visual-vendor";
	}

	if (packageName.startsWith("@supabase/")) {
		return "supabase-vendor";
	}

	if (
		packageName === "@hello-pangea/dnd" ||
		packageName === "lucide-react" ||
		packageName.startsWith("@heroui/") ||
		packageName.startsWith("@react-aria/") ||
		packageName.startsWith("@react-stately/") ||
		packageName.startsWith("@react-types/") ||
		packageName.startsWith("@internationalized/") ||
		packageName.startsWith("@floating-ui/") ||
		packageName.startsWith("@zag-js/")
	) {
		return "ui-vendor";
	}

	if (packageName.startsWith("@tanstack/") || packageName === "zustand") {
		return "state-vendor";
	}

	return "vendor";
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
	server: {
		host: "0.0.0.0",
		port: 5173,
		strictPort: false,
		allowedHosts: true,
		watch: {
			usePolling: true,
		},
	},
	css: {
		postcss: {
			plugins: [autoprefixer()],
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: getManualChunk,
			},
		},
	},
	plugins: [
		react(),
		tailwindcss(),
		consoleForwardPlugin({
			enabled: command === "serve",
			endpoint: "/__dev/client-logs",
			levels: ["log", "warn", "error", "info", "debug"],
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "..", "src"),
			"@/app": path.resolve(__dirname, "..", "src/app"),
			"@/features": path.resolve(__dirname, "..", "src/features"),
			"@/shared": path.resolve(__dirname, "..", "src/shared"),
			"@/services": path.resolve(__dirname, "..", "src/services"),
		},
	},
}));
