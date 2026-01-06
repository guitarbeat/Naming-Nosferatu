import { fileURLToPath } from "url";
import { dirname, resolve as pathResolve } from "path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = pathResolve(__dirname, "..");

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [pathResolve(projectRoot, "src/setupTests.ts")],
    testTimeout: 10000,
    env: {
      VITE_SUPABASE_URL: "https://test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
  resolve: {
    alias: {
      "@": pathResolve(projectRoot, "src"),
      "@components": pathResolve(projectRoot, "src/shared/components"),
      "@hooks": pathResolve(projectRoot, "src/core/hooks"),
      "@utils": pathResolve(projectRoot, "src/shared/utils"),
      "@services": pathResolve(projectRoot, "src/shared/services"),
      "@styles": pathResolve(projectRoot, "src/shared/styles"),
      "@features": pathResolve(projectRoot, "src/features"),
      "@core": pathResolve(projectRoot, "src/core"),
    },
  },
});
