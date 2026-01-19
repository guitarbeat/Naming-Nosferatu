import { dirname, resolve as pathResolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = pathResolve(__dirname, "..");

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		testTimeout: 10000,
		setupFiles: [pathResolve(projectRoot, "source/setupTests.ts")],
		env: {
			VITE_SUPABASE_URL: "https://test.supabase.co",
			VITE_SUPABASE_ANON_KEY: "test-anon-key",
		},
	},
	resolve: {
		alias: {
			"@": pathResolve(projectRoot, "source"),
			"@components": pathResolve(projectRoot, "source/shared/components"),
			"@hooks": pathResolve(projectRoot, "source/core/hooks"),
			"@utils": pathResolve(projectRoot, "source/shared/utils"),
			"@services": pathResolve(projectRoot, "source/shared/services"),
			"@styles": pathResolve(projectRoot, "source/shared/styles"),
			"@features": pathResolve(projectRoot, "source/features"),
			"@core": pathResolve(projectRoot, "source/core"),
		},
	},
});
